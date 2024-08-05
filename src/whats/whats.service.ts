import { Injectable } from '@nestjs/common';
import { Client, LocalAuth, Message, } from 'whatsapp-web.js'
import * as qrcode from 'qrcode-terminal';
import { LeadService } from 'src/lead/lead.service';
import FindTimeSP from 'hooks/time';
type ConversationStep = 'INITIAL_CONTACT' | 'GET_NAME' | 'GET_VEHICLE_INFO' | 'GET_REGION' | 'GET_MEASURE' | 'COMPLETE' | 'CONFIRMATION';
@Injectable()
export class WhatsService {
  private client: Client;

  constructor(
    private leadService  : LeadService,    
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

  // ################ PASSIVE ###################### \\

  private conversationState: { [chatId: string]: ConversationStep } = {};
  private userData: { [chatId: string]: { name?: string; vehicle?: string; region?: string; measure?: string; } } = {};

  private isWithinBusinessHours(): boolean {
    const now = new Date();
    const brtOffset = -3; // Horário de Brasília é UTC-3
    const currentHour = (now.getUTCHours() + brtOffset + 24) % 24; // Convertendo para horário de Brasília
  
    // Defina o horário de início e término do atendimento
    const startHour = 8; // 08:00
    const endHour = 17;  // 17:00
  
    // Verifica se a hora atual está dentro do horário de atendimento
    return currentHour >= startHour && currentHour < endHour;
  };
  
  private async getConversationState(chatId: string): Promise<ConversationStep> {
    return this.conversationState[chatId] || 'INITIAL_CONTACT';
  };

  private async updateConversationState(chatId: string, step: ConversationStep) {
    this.conversationState[chatId] = step;
  };

  private async handleIncomingMessage(message: Message) {
    const chatId = message.from;
    const haveLabel = await this.client.getChatLabels(chatId);
    if(haveLabel.length != 0){
      await this.client.addOrRemoveLabels([], [chatId])
      return 
    }
    const conversationStep = await this.getConversationState(chatId);
    switch (conversationStep) {
      case 'INITIAL_CONTACT':
        await this.sendFirstContactResponse(chatId);
        await this.updateConversationState(chatId, 'GET_NAME');
        break;

      case 'GET_NAME':
        await this.collectName(chatId, message.body);
        await this.updateConversationState(chatId, 'GET_VEHICLE_INFO');
        break;

      case 'GET_VEHICLE_INFO':
        await this.collectVehicleInfo(chatId, message.body);
        await this.updateConversationState(chatId, 'GET_REGION');
        break;

      case 'GET_REGION':
        await this.collectRegionInfo(chatId, message.body);
        await this.updateConversationState(chatId, 'GET_MEASURE');
        break;

      case 'GET_MEASURE':
        await this.collectMeasureInfo(chatId, message.body);
        await this.updateConversationState(chatId, 'CONFIRMATION');
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

  private async finalizeProcess(chatId: string) {
    this.client.addOrRemoveLabels(['18'], [chatId])
    if (!this.isWithinBusinessHours()) {
      await this.client.sendMessage(chatId, "📢 *Expediente finalizado*\n\n Entraremos em contato assim que pudermos. O horário de atendimento é das 08:00 às 17:00.");
      return;
    }
    await this.client.sendMessage(chatId, "💁🏾‍♀️ *Obrigada!* \n\n Agora vamos te passar para nossos atendentes, para apresentar as operações.");
    const time = FindTimeSP();
    const userData = this.userData[chatId];
    const phone = chatId.replace(/\D/g, '');
    const params = {
      id_admin   :0,
      phone      :phone,
      typeVehicle:userData.vehicle,
      name       :userData.name,
      region     :userData.region,
      measure    :userData.region,
      label      :'yellow',
      create_at  :time
    }
    const response = await this.leadService.create(params);
    console.log(response);
    await this.updateConversationState(chatId, 'COMPLETE');
    delete this.userData[chatId];
  };
  
  private async resetProcess(chatId: string) {
    await this.client.sendMessage(chatId, "Vamos começar de novo. Qual é o seu nome?");
    await this.updateConversationState(chatId, 'GET_NAME');
    // Opcional: Limpar os dados do usuário se necessário
    delete this.userData[chatId];
  };

  private async sendFirstContactResponse(chatId: string){
    try {
      const presentation = `💁🏾‍♀️ \n*Olá, somos a Mix serv log | Entregas |*\nEntregamos Soluções Logísticas Eficientes\n🚚 +2 milhões Entregas feitas por todo Brasil\n👇 Conheça mais sobre nós\n*Site:* https://www.mixservlog.com.br/ \n*Instagram:* https://www.instagram.com/mixservlog/`
      await this.client.sendMessage(chatId, presentation);
      await this.client.sendMessage(chatId, "👋 Qual é o seu nome?");
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
    await this.client.sendMessage(chatId, "🚚 Qual é o seu veículo?");
  };

  private async collectVehicleInfo(chatId: string, vehicleInfo: string) {
    // Armazena a informação do veículo
    if (!this.userData[chatId]) {
      this.userData[chatId] = {};
    }
    this.userData[chatId].vehicle = vehicleInfo;
    await this.client.sendMessage(chatId, "📍 Qual é a sua região?");
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
        await this.updateConversationState(chatId, 'CONFIRMATION');
      } else {
        await this.client.sendMessage(chatId, "Não consegui coletar todas as informações. Por favor, tente novamente.");
        // Opcional: Retornar ao início ou terminar o atendimento
      }
    }catch(e){
      console.log(e)
    }
  };

}
