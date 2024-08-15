import { Injectable } from '@nestjs/common';
import { Client, LocalAuth, Message, } from 'whatsapp-web.js'
import * as qrcode from 'qrcode-terminal';
import { LeadService } from 'src/lead/lead.service';
import FindTimeSP from 'hooks/time';
type ConversationStepOne = 'INITIAL_CONTACT' | 'GET_NAME' | 
'GET_VEHICLE_INFO' | 'GET_REGION' | 'GET_MEASURE' | 'COMPLETE' | 'CONFIRMATION' ;
type ConversationStepTwo = 'INVITATION' | 'DECISION' | 'CADASTER' | 'CONFIRM_CADASTER' | 'PROPOSAL';
@Injectable()
export class WhatsService {
  private client: Client;

  constructor(
    private leadService:LeadService,    
  ){}

  onModuleInit() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        // executablePath: '/usr/bin/chromium-browser',
        headless: true,  
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--unhandled-rejections=strict',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          // '--single-process',
          '--disable-gpu'
        ],
        timeout: 0,
      }
    });

    this.client.on('qr', qr => {
      console.log(qr)
      qrcode.generate(qr, {small: true});
    });

    this.client.on('ready', () => {
      console.log('Cliente está pronto!');
    });

    this.client.on('message', async (message: Message) => {
      if(message.id.remote != '5511932291233@c.us'){
        return
      }
      const haveLabel = await this.client.getChatLabels(message.from);
      if(haveLabel.length > 0){
        switch (haveLabel[0].id) {
          case '18':
            this.handleIncomingMessageTwo(message)
            break;
        
          default:
            break;
        }
        return 
      }
      await this.handleIncomingMessage(message);
    });

    this.client.initialize();
  };
  

  // ################ ACTIVE ###################### \\

  async availability(number: string, status: string, date: string) {
    date = date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$3/$2/$1");
    const newNumber = `${number}@c.us`; // número do destinatário
    let message;
    
    switch (status) {
      case 'hasCharge':
        message = `*Olá, aqui é a Mix (assistente virtual 🙋🏾‍♀️)*\n\n*Passando pra te avisar que você está confirmado para carregar amanhã 📦*\n*📆 ${date}*\n*🕓 5:00am*\n*📍  CD - Fast Shop Rod Anhanguera Km 37,5. CEP: 07789-100. Bairro: Jordanesia*\n\n\n*❗Atenção: Quando chegar no CD entre no app e confirme que você chegou no local*`;
        break;
      case 'noCharge':
        message = `*Olá, aqui é a Mix (assistente virtual 🙋🏾‍♀️)*\n\n*Passando pra te avisar que você infelizmente não foi selecionado 🙍🏾‍♀️*\n\n*❌Sem carga para amanhã* \n\n\n*📌 Mas não desanime pois a partir das 8:00am até as 14:00pm você pode marcar novamente a disponibiliade pelo app*`;
        break;
      default:
        return {
          status: 400,
          message: 'Invalid status'
        };
    }
  
    try {
      await this.client.sendMessage(newNumber, message);
      return {
        status: 200,
        message: 'Message sent successfully'
      };
    } catch (err) {
      console.error('Failed to send message', err);
      process.exit(1)
      return {
        status: 500,
        message: 'Server internal error'
      };
      
    }
  };

  async avalidPhotoReproved(number: string, photo: string) {
    const newNumber = `${number}@c.us`; // número do destinatário
    let message = `*Olá, aqui é a Mix (Assistente Virtual 🙋🏾‍♀️)*\n\n Passando para te avisar que sua foto *${photo}* foi reprovada 🤦🏾‍♀️ \n\n Mas não fique triste, abra o seu app Mix Driver e envie uma nova imagem para análise 💁🏾‍♀️`;
  
    try {
      await this.client.sendMessage(newNumber, message);
      return {
        status: 200,
        message: 'Message sent successfully'
      };
    } catch (err) {
      console.error('Failed to send message', err);
      process.exit(1)
      return {
        status: 500,
        message: 'Server internal error'
      };
    }
  };
  
  async forgotPassword(number: string, code: string){
    const newNumber = `${number}@c.us`; 
    let message = `*Olá, aqui é a Mix (Assistente Virtual 🙋🏾‍♀️)*\n\n
      Aqui está seu código de verificação: \n
      *Código: ${code.split('').join(' ')} 👩🏾‍💻 * cleck cleck* *\n\nuse em menos de 5 minutos, senão...\n *EU VOU EXPLODIR* 🧙🏾‍♀️💥 \n(brincadeira! O código vai expirar mesmo 🙆🏾‍♀️)`;
    try {
      await this.client.sendMessage(newNumber, message);
      return {
        status: 200,
        message: 'Message sent successfully'
      };
    } catch (err) {
      console.error('Failed to send message', err);
      process.exit(1)
      return {
        status: 500,
        message: 'Server internal error'
      };
    }
  };

  // ################ PASSIVE (no label) ###################### \\

  private conversationState: { [chatId: string]: ConversationStepOne } = {};
  private userData: { [chatId: string]: { name?: string; vehicle?: string; region?: string; measure?: string; } } = {};

  private async handleIncomingMessage(message: Message) {
    const chatId = message.from;
    const ConversationStepOne = await this.getConversationState(chatId);
    switch (ConversationStepOne) {
      case 'INITIAL_CONTACT':
        await this.sendFirstContactResponse(chatId);
        await this.updateConversationStateOne(chatId, 'GET_NAME');
        break;

      case 'GET_NAME':
        await this.collectName(chatId, message.body);
        await this.updateConversationStateOne(chatId, 'GET_VEHICLE_INFO');
        break;

      case 'GET_VEHICLE_INFO':
        await this.collectVehicleInfo(chatId, message.body);
        break;

      case 'GET_REGION':
        await this.collectRegionInfo(chatId, message.body);
        await this.updateConversationStateOne(chatId, 'GET_MEASURE');
        break;

      case 'GET_MEASURE':
        await this.collectMeasureInfo(chatId, message.body);
        await this.updateConversationStateOne(chatId, 'CONFIRMATION');
        break;

      case 'CONFIRMATION':
        if (message.body.toLowerCase() === 'sim') {
          await this.finalizeProcess(chatId);
        } else if (message.body.toLowerCase() === 'não' || message.body.toLowerCase() === 'nao' ) {       
          await this.resetProcess(chatId);
        } else {
          await this.client.sendMessage(chatId, "Resposta não reconhecida. Por favor, responda com 'Sim' ou 'Não'.");
        }
        break;
    
    }
  };
  
  private async getConversationState(chatId: string): Promise<ConversationStepOne> {
    return this.conversationState[chatId] || 'INITIAL_CONTACT';
  };

  private async updateConversationStateOne(chatId: string, step: ConversationStepOne) {
    this.conversationState[chatId] = step;
  };

  private async finalizeProcess(chatId: string) {
    this.client.addOrRemoveLabels(['18'], [chatId])
    const time = FindTimeSP();
    const userData = this.userData[chatId];
    const phone = chatId.replace(/\D/g, '');
    const params = {
      id_admin   :0,
      phone      :phone,
      typeVehicle:userData.vehicle,
      name       :userData.name,
      region     :userData.region,
      measure    :userData.measure,
      label      :'yellow',
      create_at  :time
    }
    const response = await this.leadService.create(params);
    const presentation = `*A Mix Entregas* 🧡\nestá construindo o futuro das entregas no Brasil. \nvenha fortalecer a nossa:\n *COMUNIDADE DE ENTREGADORES* \ne aproveitar as oportunidades para realizar entregas através:\n *APP MIX DRIVE* \n *OPERAÇÕES DEDICAS* \nmande seu e-mail para acesso antecipado \n\n*1-* Cadastrar no app \n*2-* Conhecer operações`
    await this.client.sendMessage(chatId, presentation);
    delete this.userData[chatId];
  };
  
  private async resetProcess(chatId: string) {
    await this.client.sendMessage(chatId, "Errei 🤦🏾‍♀️ vamos começar de novo\n Qual é o seu nome? 🤐");
    await this.updateConversationStateOne(chatId, 'GET_NAME');
    // Opcional: Limpar os dados do usuário se necessário
    delete this.userData[chatId];
  };

  private async sendFirstContactResponse(chatId: string){
    try {
      const presentation = `💁🏾‍♀️ *Olá, Seja bem vindo ao nosso atendimento!*\n *Eu sou a Mix a sua atendente!*  \n\n*Nós somos a Mix serv log | Entregas |*\nEntregamos Soluções Logísticas Eficientes\n🚚 +2 milhões Entregas feitas por todo Brasil\n👇 Conheça mais sobre nós\n*Site:* https://www.mixservlog.com.br/ \n*Instagram:* https://www.instagram.com/mixservlog/`
      await this.client.sendMessage(chatId, presentation);
      await this.client.sendMessage(chatId, "🧡 Qual é o seu nome?");
    } catch (err) {
      console.error('Erro ao enviar a mensagem:', err);
      process.exit(1)
    }
  };

  private async collectName(chatId: string, name: string) {
    // Armazena a informação do nome
    if (!this.userData[chatId]) {
      this.userData[chatId] = {};
    }
    this.userData[chatId].name = name;
    const message = '🛞 *Qual é o tipo do seu veículo?*\n\n1- 🛵 moto \n2- 🚗 carro \n3- 🛻 fiorino\n4- 🚐 van \n5- 🚚 hr\n6- 🚚 vuc \n7- 🚚 3/4\n8- 🚛 toco \n9- 🚛 truck \n\n ✍🏾 selecione seu veículo através do número ';
    await this.client.sendMessage(chatId, message);
  };

  private async collectVehicleInfo(chatId: string, vehicleInfo: string) {
    // Armazena a informação do veículo
    if (!this.userData[chatId]) {
      this.userData[chatId] = {};
    }
    switch (vehicleInfo.toLocaleLowerCase()) {
      case '1' :
        this.userData[chatId].vehicle = 'moto';
        break;
      case '2':
        this.userData[chatId].vehicle = 'carro';
        break;
      case '3':
        this.userData[chatId].vehicle = 'fiorino';
        break;
      case '4':
        this.userData[chatId].vehicle = 'van';
        break;
      case '5':
        this.userData[chatId].vehicle = 'hr';
        break;
      case '6':
        this.userData[chatId].vehicle = 'vuc';
        break;
      case '7':
        this.userData[chatId].vehicle = '3/4';
        break;
      case '8':
        this.userData[chatId].vehicle = 'toco';
        break;
      case '9':
        this.userData[chatId].vehicle = 'truck';
        break;
    
      default:
        await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo");
        const message = '🛞 *Qual é o tipo do seu veículo?*\n\n1- 🛵 moto \n2- 🚗 carro \n3- 🛻 fiorino\n4- 🚐 van \n5- 🚚 hr\n6- 🚚 vuc \n7- 🚚 3/4\n8- 🚛 toco \n9- 🚛 truck \n\n ✍🏾 selecione seu veículo através do número ';
        await this.client.sendMessage(chatId, message)
        return
    }
    await this.client.sendMessage(chatId, "📍 Qual é a sua região?");
    await this.updateConversationStateOne(chatId, 'GET_REGION');
  };

  private async collectRegionInfo(chatId: string, regionInfo: string) {
    const userData = this.userData[chatId];
    if (!this.userData[chatId]) {
      this.userData[chatId] = {};
    }
    this.userData[chatId].region = regionInfo;
    await this.client.sendMessage(chatId, `📐 Quais as medidas interna do ${userData.vehicle} (Alt x Larg x Comp)?`);
  };

  private async collectMeasureInfo(chatId: string, measureInfo: string) {
    // Armazena a informação do veículo
    if (!this.userData[chatId]) {
      this.userData[chatId] = {};
    }
    this.userData[chatId].measure = measureInfo;
    await this.confirmData(chatId); 
  };

  private async confirmData(chatId: string) {
    try{
      const userData = this.userData[chatId];
      const confirmationMessage = `📋📦 As informações está correta? \n\n 😁 *Nome:* ${userData.name}\n🚚 *Veículo:* ${userData.vehicle}\n📍 *Região:* ${userData.region}\n📐 *Medida:* ${userData.measure} \n\n*Está tudo correto 👀?* \nResponda com "sim" ou "não"`;
      if (userData) {
        await this.client.sendMessage(chatId, confirmationMessage);
        await this.updateConversationStateOne(chatId, 'CONFIRMATION');
      } else {
        await this.client.sendMessage(chatId, "Não consegui coletar todas as informações. Por favor, tente novamente.");
        // Opcional: Retornar ao início ou terminar o atendimento
      }
    }catch(e){
      console.log(e)
    }
  };

  // ################ PASSIVE (yellow) ###################### \\

  private conversationStateTwo: { [chatId: string]: ConversationStepTwo } = {};
  
  private async updateConversationStateTwo(chatId: string, step: ConversationStepTwo) {
    this.conversationStateTwo[chatId] = step;
  };

  private async getConversationStateTwo(chatId: string): Promise<ConversationStepTwo> {
    return this.conversationStateTwo[chatId] || 'INVITATION' ;
  };

  private async handleIncomingMessageTwo(message: Message) {
    const chatId = message.from;
    const ConversationStepTwo = await this.getConversationStateTwo(chatId);
    switch (ConversationStepTwo) {
      case 'INVITATION':
        await this.sendInvitationApp(chatId);
        await this.updateConversationStateTwo(chatId, 'DECISION');
        break;
      case 'DECISION':
        switch (message.body.toLowerCase()) {
          case '1':
            this.sendApp(chatId)
            await this.updateConversationStateTwo(chatId, 'CADASTER');
            break;
          case '2':
            this.sendProposal(chatId)
            break;
            default:
              await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n*1-* Cadastrar no app \n*2-* Conhecer operações");
              break;
        }
        break
      case 'CADASTER':
        this.sendConfirmEmail(chatId, message.body)
        await this.updateConversationStateTwo(chatId, 'CONFIRM_CADASTER');
        break
      case 'CONFIRM_CADASTER':
        switch (message.body.toLocaleLowerCase()) {
          case 'sim':
            this.sendProposal(chatId)
            break;
          case 'não':
            this.sendApp(chatId)
            await this.updateConversationStateTwo(chatId, 'CADASTER');
            break;
          case 'nao':
            this.sendApp(chatId)
            await this.updateConversationStateTwo(chatId, 'CADASTER');
            break;
          default:
            await this.client.sendMessage(chatId, `Não entendi 😵‍💫, o e-mail está correto ? \n\nResponda com "sim" ou "não" `);
            break;
        }
        break
      case 'PROPOSAL':
        const response = this.leadService.findOnePhone(chatId)
        console.log(response)
        break
    };
  }

  private async sendInvitationApp(chatId: string){
    const presentation = `*A Mix Entregas* 🧡\nestá construindo o futuro das entregas no Brasil. \nvenha fortalecer a nossa:\n *COMUNIDADE DE ENTREGADORES* \ne aproveitar as oportunidades para realizar entregas através:\n *APP MIX DRIVE* \n *OPERAÇÕES DEDICAS* \nmande seu e-mail para acesso antecipado \n\n*1-* Cadastrar no app \n*2-* Conhecer operações`
    await this.client.sendMessage(chatId, presentation);
  }

  private async sendApp(chatId: string){
    const message = `*Envie seu email* 📧 \nO que está registrado na sua playStore, e te daremos acesso antecipato em breve \n\n *Qual seu email?* ✍🏾`
    await this.client.sendMessage(chatId, message);
  }

  private async sendConfirmEmail(chatId: string, email: string){
    const message = `📧 ${email} \n\n*o e-mail está correto 👀?* \nResponda com "sim" ou "não"`
    await this.client.sendMessage(chatId, message);
  }

  private async sendProposal(chatId: string){
    const response = await this.leadService.findOnePhone(chatId.replace(/@c\.us$/, ''))
    switch (response.result.typeVehicle.toLowerCase()) {
      case 'vuc':
        const message = `*PROPOSTA OPERAÇÃO DEDICADA FAST CAJAMAR* \n\n*PERFIL VUC 🚚*\n\n📍 *Local:* Cd Cajamar\n⏰ *Horário:* Carregamento 5h\n📅 *Segunda a Sábado*\n `
        await this.client.sendMessage(chatId, message);
        break;
    
      default:

        break;
    }
  }

}
