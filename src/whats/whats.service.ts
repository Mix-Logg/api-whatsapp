import { Injectable } from '@nestjs/common';
import { Client, LocalAuth, Message, } from 'whatsapp-web.js'
import * as qrcode from 'qrcode-terminal';
import { LeadService } from 'src/lead/lead.service';
import FindTimeSP from 'hooks/time';
type ConversationStepOne = 'INITIAL_CONTACT' | 'GET_NAME' | 
'GET_VEHICLE_INFO' | 'GET_REGION' | 'GET_MEASURE' | 'GET_EMAIL' | 'COMPLETE' | 'CONFIRMATION' ;
type ConversationStepTwo = 'INVITATION' | 'PROPOSAL' | 'PRESENTATION' | 'DECISION_PROPOSAL' | 'APPROVED' | 'RECUSE' | 'REGION_PROPOSAL';
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
      // const allLabel  = await this.client.getLabels();
      // console.log(allLabel)
      if(haveLabel.length > 0){
        switch (haveLabel[0].id) {
          case '18':
            this.handleIncomingMessageTwo(message)
            return;
          case '24':
            this.sendWaitService(message.id.remote)
            // suporte
            return
          case '25':
            // doc
            return
          case '26':
            // humanizado
            return
          default:
            return
        }
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
  private userData: { [chatId: string]: { name?: string; vehicle?: string; region?: string; measure?: string; email?:string; } } = {};

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
        await this.updateConversationStateOne(chatId, 'GET_EMAIL');
        break;

      case 'GET_EMAIL':
        await this.collectEmail(chatId, message.body);
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
      email      :userData.email,
      label      :'yellow',
      create_at  :time
    }
    const response = await this.leadService.create(params);
    await this.updateConversationStateTwo(chatId, 'PROPOSAL');
    const presentation = `*A Mix Entregas* 🧡\n\nEstá construindo o futuro das entregas no Brasil 🇧🇷\n\nVenha fortalecer 💪🏾 a nossa comunidade de entregadores 📦\n\nE aproveitar as oportunidades para realizar entregas através:\n 📱 App Mix Drive \n 🚀 Operações Dedicadas  \n\n*1-* Cadastrar no app \n*2-* Conhecer operações`
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
    const message = ' 📧 Qual seu e-mail ?';
    await this.client.sendMessage(chatId, message);
  };

  private async collectEmail(chatId: string, email: string) {
    // Armazena a informação do nome
    if (!this.userData[chatId]) {
      this.userData[chatId] = {};
    }
    this.userData[chatId].email = email;
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
      const confirmationMessage = `📋📦 As informações está correta? \n\n😁 *Nome:* ${userData.name}\n📧 *Email:* ${userData.email} \n🚚 *Veículo:* ${userData.vehicle}\n📍 *Região:* ${userData.region}\n📐 *Medida:* ${userData.measure} \n\n*Está tudo correto 👀?* \nResponda com "sim" ou "não"`;
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
        this.sendProposalOption(chatId)
        await this.updateConversationStateTwo(chatId, 'PROPOSAL');
        break;
      case 'PROPOSAL':
        this.sendProposalOption(chatId)
        break
      case 'PRESENTATION':
        this.sendPressentationOrHelp(chatId, message.body.toLowerCase());
        break
      case 'DECISION_PROPOSAL':
        this.sendDecisionProposal(chatId,message.body)
        break
      case 'RECUSE':
        this.sendRecuse(chatId)
        await this.updateConversationStateTwo(chatId, 'PROPOSAL');
        break
     };
  }

  private async sendInvitationApp(chatId: string){
    const presentation = `*A Mix Entregas* 🧡\n\nEstá construindo o futuro das entregas no Brasil 🇧🇷\n\nVenha fortalecer 💪🏾 a nossa comunidade de entregadores 📦\n\nE aproveitar as oportunidades para realizar entregas através:\n 📱 App Mix Drive \n 🚀 Operações Dedicadas\n`
    await this.client.sendMessage(chatId, presentation);
  };

  private async sendProposalOption(chatId: string){
    const response = await this.leadService.findOnePhone(chatId.replace(/@c\.us$/, ''))
    if (response && response.result && response.result.typeVehicle) {
      let message:string;
      switch (response.result.typeVehicle.toLowerCase()) {
        case 'moto':
          await this.client.sendMessage(chatId, `atualmente não temos operações para motos 😞 \n\n mas assim que abri uma oportunidade, entraremos em contato 😀`);
          return
        case 'carro':
          await this.client.sendMessage(chatId, `atualmente não temos operações para carro 😞 \n\n mas assim que abri uma oportunidade, entraremos em contato 😀`);
          return
        case 'fiorino':
          message = `🛻 *${response.result.typeVehicle.toLowerCase()}*\n*Centros de Distribuição (CD)*\naqui estão as operações que combinam com você\n\n*1-* Cajamar/SP \n\n*0-* Falar com atendente`
          await this.client.sendMessage(chatId, message);
          await this.updateConversationStateTwo(chatId, 'PRESENTATION');
          return
        case 'van':
          message = `🚐 *${response.result.typeVehicle.toLowerCase()}*\n*Centros de Distribuição (CD)*\naqui estão as operações que combinam com você\n\n*1-* Guarulhos/SP\n*2-* Vila Leopoldina/SP \n\n*0-* Falar com atendente`
          await this.client.sendMessage(chatId, message);
          await this.updateConversationStateTwo(chatId, 'PRESENTATION');
          return
        case 'hr':
          message = `🚚 *${response.result.typeVehicle.toLowerCase()}*\n*Centros de Distribuição (CD)*\naqui estão as operações que combinam com você\n\n*1-* Cajamar/SP\n*2-* Guarulhos/SP\n*3-* Vila Leopoldina/SP\n*4-* Uberlândia/MG\n*5-* Contagem/MG \n\n*0-* Falar com atendente`
          await this.client.sendMessage(chatId, message);
          await this.updateConversationStateTwo(chatId, 'PRESENTATION');
          return
        case 'vuc':
          message = `🚚 *${response.result.typeVehicle.toLowerCase()}*\n*Centros de Distribuição (CD)*\naqui estão as operações que combinam com você\n\n*1-* Cajamar/SP\n*2-* Barueri/SP\n*3-* Uberlândia/MG\n*3-* Contagem/MG \n\n*0-* Falar com atendente`
          await this.client.sendMessage(chatId, message);
          await this.updateConversationStateTwo(chatId, 'PRESENTATION');
          return;
        case '3/4':
          message = `🚚 *${response.result.typeVehicle.toLowerCase()}*\n*Centros de Distribuição (CD)*\naqui estão as operações que combinam com você\n\n*1-* Barueri/SP\n*2-* Contagem/MG\n*3-* Uberlândia/MG\n\n*0-* Falar com atendente`
          await this.client.sendMessage(chatId, message);
          await this.updateConversationStateTwo(chatId, 'PRESENTATION');
          return
        case 'toco':
          message = `🚛 *${response.result.typeVehicle.toLowerCase()}*\n*Centros de Distribuição (CD)*\naqui estão as operações que combinam com você\n\n*1-* Barueri/SP\n\n*0-* Falar com atendente`
          await this.client.sendMessage(chatId, message);
          await this.updateConversationStateTwo(chatId, 'PRESENTATION');
          return
        case 'truck':
          message = `🚛 *${response.result.typeVehicle.toLowerCase()}*\n*Centros de Distribuição (CD)*\naqui estão as operações que combinam com você\n\n*1-* Barueri/SP\n\n*0-* Falar com atendente`
          await this.client.sendMessage(chatId, message);
          await this.updateConversationStateTwo(chatId, 'PRESENTATION');
          return
        default:
      }
    }
    this.client.addOrRemoveLabels([], [chatId])
    await this.client.sendMessage(chatId, `Não reconheci seu registro, Vamos começar novamente`);
    await this.updateConversationStateOne(chatId, 'GET_NAME');
    this.sendFirstContactResponse(chatId)
  };

  private async sendPressentationOrHelp(chatId: string, message:string){
    const response = await this.leadService.findOnePhone(chatId.replace(/@c\.us$/, ''))
    let sendMessage:string;
    switch (response.result.typeVehicle.toLowerCase()) {
      case 'moto':
        switch (message) {
          case '1':
            
            break;
          
          default:
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            this.sendProposalOption(chatId)
            break;
        }
        break;
      case 'carro':
        switch (message) {
          case '1':
            
            break;
          
          default:
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            this.sendProposalOption(chatId)
            break;
        }
        break;
      case 'fiorino':
        switch (message) {
          case '1':
            sendMessage = `*Cajamar/SP*\n\n🚪 *Operação:* porta a porta\n📍 *Local:* Cajamar/SP\n🕑 *Período:* Segunda a Sábado\n🚚 *Carregamento:* 5:00h\n🚧 *Pedágio:* reembolso pedágio no sem parar\n📦 *Produto:* eletrônico/eletrodomésticos`
            await this.client.sendMessage(chatId, sendMessage);
            sendMessage = `*Benefícios*\n\n☕ *café da manhã*\n📱 *App*\n💰 *Adiantamento*`
            await this.client.sendMessage(chatId, sendMessage);
            sendMessage = `*Pagamento*\n\n*1° Quinzena, considera o período ( 01 a 15)*\n🤑 Paga dia 02 do mês subsequente\n\n*2° Quinzena, considera o período ( 16 a 31)*\n💸 Paga dia 16 do mês subsequente`
            await this.client.sendMessage(chatId, sendMessage);
            sendMessage = `*1-* aceitar \n*2-* voltar as operações\n\n*0-* Falar com atendente`
            await this.client.sendMessage(chatId, sendMessage);
            await this.updateConversationStateTwo(chatId, 'DECISION_PROPOSAL');
            break;
          case '0':
            await this.client.sendMessage(chatId,'os nossos atendentes vão continuar com o seu atendimento 🤩')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['24'], [chatId])
            break;
          default:
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            this.sendProposalOption(chatId)
            break;
        }
        break;
      case 'van':
        switch (message) {
          case '1':
            
            break;
          
          default:
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            this.sendProposalOption(chatId)
            break;
        } 
        break;
      case 'hr':
        switch (message) {
          case '1':
            
            break;
          
          default:
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            this.sendProposalOption(chatId)
            break;
        }
        break;
      case 'vuc':
        switch (message) {
          case '1':
            sendMessage = `*Fast-Shop*\n\n🚪 Operação: porta a porta\n📍 Local: Cd Cajamar\n🕑 Período: Segunda a Sábado\n🚚 Carregamento: 5:00h  \n🚧 Pedágio: reembolso pedágio no sem parar.\n📦 Produto: eletrônico/eletrodomésticos`
            await this.client.sendMessage(chatId, sendMessage);
            sendMessage = `*Benefícios*\n\n☕ café da manhã\n📱 App\n💰 Adiantamento\n⛽ Convênio Posto`
            await this.client.sendMessage(chatId, sendMessage);
            sendMessage = `*Pagamento*\n\n*1° Quinzena, considera o período ( 01 a 15)* Paga dia 02 do mês subsequente\n*2° Quinzena, considera o período ( 16 a 31)* Paga dia 16 do mês subsequente`
            await this.client.sendMessage(chatId, sendMessage);
            sendMessage = `*Pré-requisitos*\n\n✅ *Altura interna Baú 2,10* \n✅ *Ajudante* (+ 18 Anos)\n✅ *Carrinho para Entrega*\n✅ Veículo precisa de instalação *EVA/Espaguete*\n \n\n*1-* aceitar \n*2-* recusar\n*3-* voltar as operações\n\n*0-* Falar com suporte`
            await this.client.sendMessage(chatId, sendMessage);
            await this.updateConversationStateTwo(chatId, 'DECISION_PROPOSAL');
            break;
          case '0':
            await this.client.sendMessage(chatId,'os nossos atendentes vão continuar com o seu atendimento 🤩')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['24'], [chatId])
            break;
          default:
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            this.sendProposalOption(chatId)
            break;
        }
        break;
      case '3/4':
        switch (message) {
          case '1':
            
            break;
          
          default:
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            this.sendProposalOption(chatId)
            break;
        }
        break;
      case 'toco':
        switch (message) {
          case '1':
            
            break;
          
          default:
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            this.sendProposalOption(chatId)
            break;
        }
        break;
      case 'truck':
        switch (message) {
          case '1':
            
            break;
          
          default:
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            this.sendProposalOption(chatId)
            break;
        }
        break;
      default:
        this.client.addOrRemoveLabels([], [chatId])
        await this.client.sendMessage(chatId, `Não reconheci seu registro, Vamos começar novamente`);
        await this.updateConversationStateOne(chatId, 'GET_NAME');
        this.sendFirstContactResponse(chatId)
        break;
    }
  };

  private async sendDecisionProposal(chatId:string, message:string){
    const response = await this.leadService.findOnePhone(chatId.replace(/@c\.us$/, ''))
    switch (response.result.typeVehicle.toLowerCase()) {
      case 'moto':
        switch (message) {
          case '1':
            break;
          
          default:
            break;
        }
        break;
      case 'carro':
        switch (message) {
          case '1':
            break;
          
          default:
            break;
        }
        break;
      case 'fiorino':
        switch (message) {
          case '1':
            await this.client.sendMessage(chatId,'*Ótimo* 🙌🏾\nagora precisa de mais *1* passo\n\nenviar os documentos necessarios 📄')
            message = `*Fotos do Veículo (documentos)*\n\n✅CRLV\n✅ANTT\n\n*Fotos do Motorista (documentos)*\n\n✅CNH\n✅Comprovante de endereço\n\n*Fotos do Proprietário do Veículo (documentos)*\n\n✅RG ou CNH\n✅Comprovante de endereço\n✅Celular`
            await this.client.sendMessage(chatId,message)
            await this.client.sendMessage(chatId,'*Por gentileza enviar as fotos bem legível* 🤳🏾')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['25'], [chatId])
            await this.updateConversationStateTwo(chatId, 'APPROVED');
            break;
          case '0':
            await this.client.sendMessage(chatId,'os nossos atendentes vão continuar com o seu atendimento 🤩')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['24'], [chatId])
            break;
          default:
            break;
        }
        break;
      case 'van':
        switch (message) {
          case '1':
            break;
          
          default:
            break;
        } 
        break;
      case 'hr':
        switch (message) {
          case '1':
            break;
          
          default:
            break;
        }
        break;
      case 'vuc':
        switch (message) {
          case '1':
          case '0':
            await this.client.sendMessage(chatId,'os nossos atendentes vão continuar com o seu atendimento 🤩')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['24'], [chatId])
            break;
          default:
            break;
        }
        break;
      case '3/4':
        switch (message) {
          case '1':
            break;
          
          default:
            break;
        }
        break;
      case 'toco':
        switch (message) {
          case '1':
            break;
          
          default:
            break;
        }
        break;
      case 'truck':
        switch (message) {
          case '1':
            
            break;
          
          default:
            break;
        }
        break;
    }
    switch (message) {
      case '1':
        await this.client.sendMessage(chatId,'*Ótimo* 🙌🏾\nagora precisa de mais *1* passo\n\nenviar os documentos necessarios 📄')
        message = `*Fotos do Veículo (documentos)*\n\n✅CRLV\n✅ANTT\n\n*Fotos do Motorista (documentos)*\n\n✅CNH\n✅Comprovante de endereço\n\n*Fotos do Auxiliar (documentos)*\n\n✅RG ou CNH\n✅Comprovante de endereço\n✅Celular\n\n*Fotos do Proprietário do Veículo (documentos)*\n\n✅RG ou CNH\n✅Comprovante de endereço\n✅Celular`
        await this.client.sendMessage(chatId,message)
        await this.client.sendMessage(chatId,'*Por gentileza enviar as fotos bem legível* 🤳🏾')
        await this.client.addOrRemoveLabels([], [chatId])
        this.client.addOrRemoveLabels(['25'], [chatId])
        await this.updateConversationStateTwo(chatId, 'APPROVED');
        break;
      case '2':
        await this.client.sendMessage(chatId,'Obrigado 🥲\n\n Assim que tivemos novas opções de operação entraremos em contato 📞')
        await this.updateConversationStateTwo(chatId, 'RECUSE');
        break;
      case '3':
        this.sendProposalOption(chatId)
        await this.updateConversationStateTwo(chatId, 'PROPOSAL');
        break
      case '0':
        await this.client.sendMessage(chatId,'os nossos atendentes vão continuar com o seu atendimento 🤩')
        await this.client.addOrRemoveLabels([], [chatId])
        this.client.addOrRemoveLabels(['24'], [chatId])
        break;
      default:
        await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
        message = `*1-* aceitar \n*2-* recusar\n*3-* voltar as operações \n\n*0-* Falar com suporte`
        await this.client.sendMessage(chatId, message);
        break;
    }
  };

  private async sendRecuse(chatId:string){
    await this.client.sendMessage(chatId,'*Que bom falar com você novamente* 😀 \n\n não vou perder tempo e já apresentar as operações! 😎')
    this.sendProposalOption(chatId)
  };

  private async sendWaitService(chatId: string){
    await this.client.sendMessage(chatId, `*você já está na lista de atendimento* 📋 \n\n🕙 aguarde nossos atendentes já entrarão em contato`);
  };

}
