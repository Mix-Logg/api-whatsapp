import { Injectable } from '@nestjs/common';
import { Client, LocalAuth, Message, MessageMedia, } from 'whatsapp-web.js'
import * as qrcode from 'qrcode-terminal';
import { LeadService } from 'src/lead/lead.service';
import FindTimeSP from 'hooks/time';
import OpenAI from "openai";

// SELECT email 
// FROM `lead` 
// WHERE email REGEXP '^[A-Za-z0-9._%+-]+@gmail\.com$'
// AND email NOT LIKE '%. %'  -- Remove espaços após o ponto
// AND email NOT LIKE '% %'  -- Remove espaços dentro do e-mail
// AND email NOT LIKE '%@%@%'  -- Garante que tem apenas um '@'
// AND email NOT LIKE '%@.%'  -- Remove '@.' que pode ser erro de digitação
// AND email NOT LIKE '%.coml'  -- Remove extensões erradas como '.coml'
// AND email NOT LIKE '%.brl'  -- Remove extensões erradas como '.brl'
// AND LENGTH(email) BETWEEN 6 AND 320;  -- Garante que tem um tamanho aceitável

type ConversationStepOne = 'INITIAL_CONTACT' | 'GET_NAME' | 
'GET_VEHICLE_INFO' | 'GET_REGION' | 'GET_MEASURE' | 'GET_EMAIL' | 'COMPLETE' | 'CONFIRMATION' | 'TRACKER';
type ConversationStepTwo = 'INVITATION' | 'PROPOSAL' | 'PRESENTATION' | 'DECISION_PROPOSAL' | 'APPROVED' | 'RECUSE' | 'REGION_PROPOSAL' ;
type ConversationCompany = 'INITIAL_CONTACT' | 'GET_NAME' | ''
type ConversationAPP = 'INITIAL_CONTACT' | 'GET_NAME' | 'GET_EMAIL' | 'GET_VEHICLE_INFO' |  'COMPLETE' | 'CONFIRMATION' | 'VERIFY_DATA' | 'APRESENTATION';
type SelectConversation = 'COMPANY' | 'APP' | 'SERVICE' | 'DECISION' | 'DEFAULT'
const usersCheks = {};
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
        executablePath: '/snap/bin/chromium',
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

    this.client.on('ready', async () => {
      console.log('Mix está pronta! 3.3v');
      // const allLead = await this.leadService.findAllByEmailValid();
      // console.log(allLead.result)
      // await this.sendBomb(allLead.result)
      // const allLabel  = await this.client.getLabels();
      // console.log(allLabel)
    });

    this.client.on('message', async (message: Message) => {
      
      if(message.id.remote === '5511932291233@c.us'){
        // this.sendProposal(message)
        // return
        if(message.body.toLocaleLowerCase() == 'test'){
          this.client.sendMessage(message.from, 'Estou funcionando! 3.3v')
        }
        if(message.body.toLocaleLowerCase() == 'unread'){
          this.resolvingUnreadMessage(); // Mensagem para os não lidos
          this.client.sendMessage(message.from, 'Enviando mensagem para não lidos!')
        }
        if(message.body.toLocaleLowerCase() == 'removelabel'){
          this.removeAllLabels(); // Remover todas as etiquetas
          this.client.sendMessage(message.from, 'removendo labels')
        }
        if(message.body.toLocaleLowerCase() == 'ia'){
          const messageSorry = await this.generateOfferMessage('Você está funcionando?');
          this.client.sendMessage(message.from, messageSorry)
        }

        if(message.body.toLocaleLowerCase() == 'bomb'){
          this.client.sendMessage(message.from, 'Enviando bomba!')
          const allLead = await this.leadService.findAllByTypeVehicle();
          this.sendBomb(allLead.result)
        }

        // if(message.body.toLocaleLowerCase() == 'bombtest'){
        //   this.client.sendMessage(message.from, 'Enviando bomba!')
        //   const allLead = await this.leadService.findAllByTypeVehicle();
        //   console.log(allLead.result.length)
        //   return
        //   this.sendBomb(allLead.result)
        // }

        if(message.body.toLocaleLowerCase() == 'event'){
          const event = '🎉 *BOA NOTÍCIA CHEGANDO!* 🚚✨\n\n🔔 *PARABÉNS!* Você foi *selecionado* para uma *operação especial*! 💼🔥\nEstamos entrando em contato apenas com motoristas escolhidos a dedo\n\n\n As *vagas* são *limitadas* e queremos saber:\nComo está sua disponibilidade e seu momento atual? preparado para ganhar dinheiro? 💰\n👉 Responda está mensagem e conheça as operações \n\n📢 *Oferta especial para VUC e HR!*';
          this.client.sendMessage(message.from, event)
          return
        }

        return
      }
      
      // if(message.id.remote === '5511947557554@c.us'){
      //   this.sendProposal(message)
      //   return
      // }

      // LOCK 🔒
      // if(message.id.remote !== '5511932291233@c.us'){
      //   return
      // }

      // ############## LABEL ############## \\
      const haveLabel = await this.client.getChatLabels(message.from);
      if(haveLabel.length > 0){
        switch (haveLabel[0].id) {
            case '25':
              // doc
              return
            case '26':
              // humanizado
              return
            case '32':
              // operação-ativo
              return
        }
      }

      // ############## TYPE CONVERSATION ############## \\
      const typeConversation = await this.getTypeConversation(message.from);
      switch (typeConversation) {
        case 'COMPANY':
          console.log('company')
          break;
        case 'APP':
          if (usersCheks[message.from]?.isVerified) {
            const haveLabel = await this.client.getChatLabels(message.from);
            if(haveLabel.length > 0){
              switch (haveLabel[0].id) {
                case '44':
                  this.awaitLinkApp(message)
                  return
                case '45':
                  const chatId = message.from;
                  const link = `✅ *Acesso já liberado!* ✍️ \n\n*Você pode baixar o app no link:* \n\nhttps://play.google.com/store/apps/details?id=com.mixtrans.mixEntregadores`
                  await this.client.sendMessage(chatId, link);
                  return
              }
            }
            await this.handleIncomingMessageApp(message);
          }
          await this.verifyCadasterApp(message);
          break;
        case 'SERVICE':
          if (usersCheks[message.from]?.isVerified) {
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
                  // suporte - fila
                  return
                case '25':
                  // doc
                  return
                case '26':
                  // humanizado
                  return
                case '32':
                  // operação-ativo
                  return
              }
            }
            await this.handleIncomingMessage(message);
          }
          this.verifyCadaster(message)
          return
        case 'DECISION':
          switch (message.body) {
            case '1':
              await this.updateTypeConversation(message.from, 'SERVICE');
              if (usersCheks[message.from]?.isVerified) {
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
                      // suporte - fila
                      return
                    case '25':
                      // doc
                      return
                    case '26':
                      // humanizado
                      return
                    case '32':
                      // operação-ativo
                      return
                  }
                }
                await this.handleIncomingMessage(message);
              }
              this.verifyCadaster(message)
              return
            case '2':
              await this.updateTypeConversation(message.from, 'APP');
              if (usersCheks[message.from]?.isVerified) {
                const haveLabel = await this.client.getChatLabels(message.from);
                if(haveLabel.length > 0){
                  switch (haveLabel[0].id) {
                    case '41':
                      this.handleIncomingMessageTwo(message)
                      return;
                  }
                }
                await this.handleIncomingMessageApp(message);
              }
              await this.verifyCadasterApp(message);
              break;
            // case '3':
            //   await this.updateTypeConversation(message.from, 'COMPANY');
            //   break;
            default:
              await this.client.sendMessage(message.from, 'Não entendi 🤯, vamos tentar de novo, escolha um *número* para continuar!');
              await this.client.sendMessage(message.from, '1 - 🚚 (Motoristas) *Operações*\n2 - 📱 (Motoristas) *APP* \n ');
              await this.updateTypeConversation(message.from, 'DECISION');
              break;
          }
          return
        default:
          const presentation = `💁🏾‍♀️ *Olá, Seja bem vindo ao nosso atendimento!*\n *Eu sou a Mix a sua atendente!*  \n\n*Nós somos a Mix serv log | Entregas |*\nEntregamos Soluções Logísticas Eficientes\n🚚 +2 milhões Entregas feitas por todo Brasil\n👇 Conheça mais sobre nós\n*Site:* https://www.mixentregas.com.br/ \n*Instagram:* https://www.instagram.com/mixservlog/`
          await this.client.sendMessage(message.from, presentation);
          const defaultMessage = 'Sobre qual assunto você gostaria de conversar?\n\n1 - 🚚 (Motoristas) *Operações*\n2 - 📱 (Motoristas) *APP* \n '
          await this.client.sendMessage(message.from, defaultMessage);
          const atentionMessage = '❗ Digite um número para continuar';
          await this.client.sendMessage(message.from, atentionMessage);
          await this.updateTypeConversation(message.from, 'DECISION');
          break;
      }

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

  async resolvingUnreadMessage() {
  const chats = await this.client.getChats();
  const unreadChats = chats.filter(chat => chat.unreadCount > 0);
  const messageSorry = await this.generateOfferMessage('Se desculpe pela demora, e pergunte se está disposto a continuar o atendimento (mensagem curta)');

  if (unreadChats.length > 0) {
    for (const chat of unreadChats) {
      await this.client.sendMessage(chat.id._serialized, messageSorry);
      await new Promise(resolve => setTimeout(resolve, 7000)); // espera 1 segundo entre envios (ajuste como quiser)
    }
  }
}

  private typeConversation: { [chatId: string]: SelectConversation } = {};
  private ConversationCompany: { [chatId: string]: ConversationCompany } = {};
  private ConversationApp: { [chatId: string]: ConversationAPP } = {};
  private conversationState: { [chatId: string]: ConversationStepOne } = {};
  private userData: { [chatId: string]: { name?: string; vehicle?: string; region?: string; measure?: string; email?:string; tracker?:string } } = {};
  
  private async getConversationState(chatId: string): Promise<ConversationStepOne> {
    return this.conversationState[chatId] || 'INITIAL_CONTACT';
  };
  
  private async getTypeConversation(chatId: string): Promise<SelectConversation> {
    return this.typeConversation[chatId] || 'DEFAULT';
  };

  private async getConversationCompany(chatId: string): Promise<ConversationCompany> {
    return this.ConversationCompany[chatId] || 'INITIAL_CONTACT';
  };

  private async getConversationApp(chatId: string): Promise<ConversationAPP> {
    return this.ConversationApp[chatId] || 'INITIAL_CONTACT';
  };

  private async updateConversationStateOne(chatId: string, step: ConversationStepOne) {
    this.conversationState[chatId] = step;
  };

  private async updateTypeConversation(chatId: string, step: SelectConversation) {
    this.typeConversation[chatId] = step;
  };

  private async updateConversationCompany(chatId: string, step: ConversationCompany) {
    this.ConversationCompany[chatId] = step;
  };

  private async updateConversationApp(chatId: string, step: ConversationAPP) {
    this.ConversationApp[chatId] = step;
  };
  
  
  // ################ COMPANY ###################### \\


  // ################ APP ###################### \\

  private async handleIncomingMessageApp(message: Message) {
    const chatId = message.from;
    const ConversationStep = await this.getConversationApp(chatId);
    switch (ConversationStep) {
      case 'INITIAL_CONTACT':
        await this.sendFirstContactResponseApp(chatId);
        await this.updateConversationApp(chatId, 'GET_NAME');
        break;
      case 'GET_NAME':
        await this.collectNameApp(chatId, message.body);
        await this.updateConversationApp(chatId, 'GET_EMAIL');
        break;
      case 'GET_EMAIL':
        await this.collectEmailApp(chatId, message.body);
        await this.updateConversationApp(chatId, 'GET_VEHICLE_INFO');
        break;
      case 'GET_VEHICLE_INFO':
        await this.collectVehicleInfoApp(chatId, message.body);
        await this.updateConversationApp(chatId, 'CONFIRMATION');
        break;
      case 'CONFIRMATION':
        if (message.body.toLowerCase() === 'sim') {
          await this.CadasterLeadApp(chatId);
        } else if (message.body.toLowerCase() === 'não' || message.body.toLowerCase() === 'nao' ) {       
          await this.resetProcessApp(chatId);
        } else {
          await this.client.sendMessage(chatId, "Resposta não reconhecida. Por favor, responda com 'Sim' ou 'Não'.");
        }
        break;
      case 'APRESENTATION':
        switch (message.body) {
          case '1':
            await this.instructionApp(chatId);
            break;
          case '2':
            const badMessage = 'Poxa que pena 😔, espero que tenha gostado da ideia!';
            await this.client.sendMessage(chatId, badMessage);
            const defaultMessage = 'Sobre qual assunto você gostaria de conversar agora 👀?\n\n1 - 🚚 (Motoristas) *Operações*\n2 - 📱 (Motoristas) *APP* \n '
            await this.client.sendMessage(chatId, defaultMessage);
            await this.updateTypeConversation(chatId, 'DECISION');
            await this.updateConversationApp(chatId, 'INITIAL_CONTACT');
            break;
          default:
            await this.client.sendMessage(chatId, 'Não entendi 🤯, vamos tentar de novo, escolha um *número* para continuar!');
            await this.client.sendMessage(chatId, "1 - *Cadastrar* \n2 - *Voltar*");
            break;
        }
        break;
      default:
        await this.client.sendMessage(chatId, 'Não entendi 🤯, vamos tentar de novo, escolha um *número* para continuar!');
        await this.updateConversationApp(chatId, 'INITIAL_CONTACT');
        break;
    }
  };

  private async resetProcessApp(chatId: string) {
    await this.client.sendMessage(chatId, "Ok 💁🏾‍♀️ vamos atualizar os dados\n Qual é o seu nome? 🤐");
    await this.updateConversationApp(chatId, 'GET_NAME');
    // Opcional: Limpar os dados do usuário se necessário
    delete this.userData[chatId];
  };

  private async sendFirstContactResponseApp(chatId: string){
    const presentation = `💁🏾‍♀️ Antes de apresentar nosso aplicativo, preciso te conhecer melhor`
    await this.client.sendMessage(chatId, presentation);
    await this.client.sendMessage(chatId, "🧡 Qual é o seu nome?");
  };

  private async collectNameApp(chatId: string, name: string) {
    // Armazena a informação do nome
    if (!this.userData[chatId]) {
      this.userData[chatId] = {};
    }
    this.userData[chatId].name = name;
    const message = ' 📧 Qual seu e-mail ?';
    await this.client.sendMessage(chatId, message);
  };

  private async collectEmailApp(chatId: string, email: string) {
    // Armazena a informação do nome
    if (!this.userData[chatId]) {
      this.userData[chatId] = {};
    }
    this.userData[chatId].email = email;
    const message = '🛞 *Qual é o tipo do seu veículo?*\n\n1- 🛵 moto \n2- 🚗 carro \n3- 🛻 fiorino\n4- 🚐 van \n5- 🚚 hr\n6- 🚚 vuc \n7- 🚚 3/4\n8- 🚛 toco \n9- 🚛 truck \n\n ✍🏾 selecione seu veículo através do número ';
    await this.client.sendMessage(chatId, message);
  };

  private async collectVehicleInfoApp(chatId: string, vehicleInfo: string) {
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
    await this.confirmDataApp(chatId); 
  };

  private async confirmDataApp(chatId: string) {
    try{
      const userData = this.userData[chatId];
      const confirmationMessage = `📋📦 As informações está correta? \n\n😁 *Nome:* ${userData.name}\n📧 *Email:* ${userData.email} \n🚚 *Veículo:* ${userData.vehicle}\n\n*Está tudo correto 👀?* \nResponda com "sim" ou "não"`;
      if (userData) {
        await this.client.sendMessage(chatId, confirmationMessage);
        await this.updateConversationApp(chatId, 'CONFIRMATION');
      } else {
        await this.client.sendMessage(chatId, "Não consegui coletar todas as informações. Por favor, tente novamente.");
        // Opcional: Retornar ao início ou terminar o atendimento
      }
    }catch(e){
      console.log(e)
    }
  };

  private async CadasterLeadApp(chatId: string) {
    await this.updateConversationApp(chatId, 'APRESENTATION');
    // this.client.addOrRemoveLabels(['44'], [chatId])

    const time = FindTimeSP();
    const userData = this.userData[chatId];
    const phone = chatId.replace(/\D/g, '');
    const params = {
      id_admin   :0,
      phone      :phone,
      typeVehicle:userData.vehicle,
      name       :userData.name,
      region     :'em branco',
      measure    :'não tenho',
      email      :userData.email,
      tracker    :'não tenho',
      label      :'',
      create_at  :time
    }
    const lead = await this.leadService.findOnePhone(phone)
    if(lead.status == 200){
      await this.leadService.update(lead.result.id ,params);
    }else{
      await this.leadService.create(params);
    }
    await this.presentationApp(chatId);
    delete this.userData[chatId];
  };

  private async presentationApp(chatId: string) {
    const presentation = `🚀 *Acesso Antecipado – Mix Entregadores* 📦\n\n💡 Seja um dos primeiros a se cadastrar na plataforma que conecta entregadores a quem precisa de frete!\n\nEstamos liberando o cadastro antecipado para entregadores. Cadastre-se agora e seja um dos primeiros a receber solicitações de frete em São Paulo – Capital!\n\n⚡ *Vagas limitadas para a fase inicial!*`
    await this.client.sendMessage(chatId, presentation);
    await this.client.sendMessage(chatId, "1 - *Cadastrar* \n2 - *Voltar*");
  };

  private async instructionApp(chatId: string){
    this.client.addOrRemoveLabels(['44'], [chatId]);
    await this.updateTypeConversation(chatId, 'DECISION');
    const instruction = `🤩 *PERFEITO* \n\n dentro de *48h* você recebera uma mensagem com o link e mais instruções do aplicativo!`
    const defaultMessage = 'Sobre qual assunto você gostaria de conversar agora 👀?\n\n1 - 🚚 (Motoristas) *Operações*\n2 - 📱 (Motoristas) *APP* \n '
    await this.client.sendMessage(chatId, instruction);
    await this.client.sendMessage(chatId, defaultMessage);
    await this.updateConversationApp(chatId, 'INITIAL_CONTACT');
  };

  private async verifyCadasterApp(message:Message){
    const chatId = message.from;
     if (usersCheks[chatId]?.isVerified) {
       // console.log("Usuário já verificado, continuando o fluxo...");
       return; // Não executa a verificação novamente
     }
 
    const number = chatId.replace('@c.us', '');
    const lead = await this.leadService.findOnePhone(number)

    if(lead.status == 200){
     this.userData[chatId] = {
       name: lead.result.name ,
       vehicle: lead.result.typeVehicle, 
       region: lead.result.region,
       measure: lead.result.measure,
       email: lead.result.email,
       tracker: lead.result.tracker,
     };
     if(!lead.result.typeVehicle || !lead.result.email || !lead.result.name){
       await this.handleIncomingMessage(message);
     }else{
       const confirmationMessage = `✍️ *Antes de apresentar o aplicativo*\n📋📦 *As suas informações continuam correta?* \n\n😁 *Nome:* ${lead.result.name}\n📧 *Email:* ${lead.result.email} \n🚚 *Veículo:* ${lead.result.typeVehicle}\n\n\n*Está tudo correto 👀?* \nResponda com "sim" ou "não"`;
       setTimeout(() => {
         this.updateConversationApp(chatId, 'CONFIRMATION');
         this.client.sendMessage(chatId, confirmationMessage)
       }, 10000)
     }
     usersCheks[chatId] = { isVerified: true}
     setTimeout(() => {
       // console.log(`Resetando estado do usuário ${chatId}`);
       delete usersCheks[chatId];
     // }, 60000); // 1 minuto de inatividade
     }, 24 * 60 * 60 * 1000); // 24 horas em milissegundos
     return
    }
    usersCheks[chatId] = { isVerified: true }
    return await this.handleIncomingMessageApp(message);
  };

  private async awaitLinkApp(message:Message){
    const chatId = message.from;
    const link = `✅ *Registramos seu Cadastro!* ✍️ \n\nEm algumas horas 🕜 você recebera uma mensagem com o link e mais instruções do aplicativo!`
    await this.client.sendMessage(chatId, link);
  };

  // ################ SERVICE ###################### \\


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
        await this.updateConversationStateOne(chatId, 'TRACKER');
        break;
      
      case 'TRACKER':
        await this.collectTrackerInfo(chatId, message.body);
        await this.updateConversationStateOne(chatId, 'CONFIRMATION');
        break

      case 'CONFIRMATION':
        if (message.body.toLowerCase() === 'sim') {
          await this.finalizeProcess(chatId);
        } else if (message.body.toLowerCase() === 'não' || message.body.toLowerCase() === 'nao' ) {       
          // console.log('caiu aqui (não)')
          await this.resetProcess(chatId);
        } else {
          await this.client.sendMessage(chatId, "Resposta não reconhecida. Por favor, responda com 'Sim' ou 'Não'.");
        }
        break;
    
    }
  };

  private async finalizeProcess(chatId: string) {
    await this.updateConversationStateTwo(chatId, 'PROPOSAL');
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
      tracker    :userData.tracker,
      label      :'yellow',
      create_at  :time
    }
    const lead = await this.leadService.findOnePhone(phone)
    if(lead.status == 200){
      const response = await this.leadService.update(lead.result.id ,params);
    }else{
      const response = await this.leadService.create(params);
    }
    await this.sendInvitationApp(chatId);
    await this.sendProposalOption(chatId)
    delete this.userData[chatId];
  };
  
  private async resetProcess(chatId: string) {
    await this.client.sendMessage(chatId, "Ok 💁🏾‍♀️ vamos atualizar os dados\n Qual é o seu nome? 🤐");
    await this.updateConversationStateOne(chatId, 'GET_NAME');
    // Opcional: Limpar os dados do usuário se necessário
    delete this.userData[chatId];
  };

  private async sendFirstContactResponse(chatId: string){
    try {
      const presentation = `💁🏾‍♀️ Antes de apresentar nossas operações, preciso te conhecer melhor`
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
    await this.client.sendMessage(chatId, `📡 Qual seu rastreador? \n\nSe não tiver digite "não tenho"`);
  };

  private async collectTrackerInfo(chatId: string, trackerInfo: string) {
    // Armazena a informação do veículo
    if (!this.userData[chatId]) {
      this.userData[chatId] = {};
    }
    this.userData[chatId].tracker = trackerInfo;
    await this.confirmData(chatId); 
  };

  private async confirmData(chatId: string) {
    try{
      const userData = this.userData[chatId];
      const confirmationMessage = `📋📦 As informações está correta? \n\n😁 *Nome:* ${userData.name}\n📧 *Email:* ${userData.email} \n🚚 *Veículo:* ${userData.vehicle}\n📡 *Rastreador:* ${userData.tracker} \n📍 *Região:* ${userData.region}\n📐 *Medida:* ${userData.measure} \n\n*Está tudo correto 👀?* \nResponda com "sim" ou "não"`;
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
  };

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
          // message = `🚐 *${response.result.typeVehicle.toLowerCase()}*\n*Centros de Distribuição (CD)*\naqui estão as operações que combinam com você\n\n*1-* Cajamar/SP`
          await this.client.sendMessage(chatId, `atualmente não temos operações para van 😞 \n\n mas assim que abri uma oportunidade, entraremos em contato 😀`);
          await this.client.sendMessage(chatId, message);
          await this.updateConversationStateTwo(chatId, 'PRESENTATION');
          return
        case 'hr':
          message = `🚚 *${response.result.typeVehicle.toLowerCase()}*\n*Centros de Distribuição (CD)*\naqui estão as operações que combinam com você\n\n*1-* Cajamar/SP\n*2-* Uberlândia/MG\n*3-* Contagem/MG \n\n*0-* Falar com atendente`
          await this.client.sendMessage(chatId, message);
          await this.updateConversationStateTwo(chatId, 'PRESENTATION');
          return
        case 'vuc':
          message = `🚚 *${response.result.typeVehicle.toLowerCase()}*\n*Centros de Distribuição (CD)*\naqui estão as operações que combinam com você\n\n*1-* Cajamar/SP\n*2-* Barueri/SP\n*3-* Uberlândia/MG\n*4-* Contagem/MG \n\n*0-* Falar com atendente`
          await this.client.sendMessage(chatId, message);
          await this.updateConversationStateTwo(chatId, 'PRESENTATION');
          return;
        case '3/4':
          message = `🚚 *${response.result.typeVehicle.toLowerCase()}*\n*Centros de Distribuição (CD)*\naqui estão as operações que combinam com você\n\n*1-* Barueri/SP\n\n*0-* Falar com atendente`
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
    let audioQuestionPath
    let mediaQuestion 
    let audioApresentationPath
    let mediaApresentation
    let imagePath
    let media
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
            
            // Imagem da Tabela
            imagePath =  `table/fastshop/cajamar-fiorino.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            
            // Audio da Apresentação
            // audioApresentationPath = `table/fastshop/cajamar-audio/apresentação.ogg`
            // mediaApresentation = MessageMedia.fromFilePath(audioApresentationPath);
            
            // Audio das Perguntas
            // audioQuestionPath = `table/fastshop/cajamar-audio/duvidas.ogg`
            // mediaQuestion     = MessageMedia.fromFilePath(audioQuestionPath);
            
            // Envio de imagem
            await this.client.sendMessage(chatId, media);
            // await this.client.sendMessage(chatId, mediaApresentation);
            // await this.client.sendMessage(chatId, mediaQuestion);

            // Mensagem de Ação
            sendMessage = `*2-* aceitar \n*1-* voltar as operações\n\n*0-* Falar com atendente`
            await this.client.sendMessage(chatId, sendMessage);
            await this.updateConversationStateTwo(chatId, 'DECISION_PROPOSAL');
            return;
          case '0':
            await this.client.sendMessage(chatId,'os nossos atendentes vão continuar com o seu atendimento 🤩')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['24'], [chatId])
            return;
          default:
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            this.sendProposalOption(chatId)
            return;
        }
        break
      case 'van':
        switch (message) {
          // case '1':
          //   sendMessage = `*Cajamar/SP*\n\n🚪 Operação: porta a porta\n📍 Local: Cajamar/SP\n🕑 Período: Segunda a Sábado\n🚚 Carregamento: 5:00h  \n🚧 Pedágio: reembolso pedágio no sem parar.\n📦 Produto: eletrônico/eletrodomésticos`
          //   await this.client.sendMessage(chatId, sendMessage);
          //   sendMessage = `*Benefícios*\n\n☕ café da manhã\n📱 App\n💰 Adiantamento\n⛽ Convênio Posto`
          //   await this.client.sendMessage(chatId, sendMessage);
          //   sendMessage = `*Pagamento*\n\n*1° Quinzena, considera o período ( 01 a 15)* Paga dia 02 do mês subsequente\n*2° Quinzena, considera o período ( 16 a 31)* Paga dia 16 do mês subsequente`
          //   await this.client.sendMessage(chatId, sendMessage);
          //   imagePath =  `table/fastshop/black/van-black.jpeg`;
          //   media = MessageMedia.fromFilePath(imagePath);
          //   audioApresentationPath = `table/fastshop/cajamar-audio/apresentação.ogg`
          //   mediaApresentation = MessageMedia.fromFilePath(audioApresentationPath);
          //   audioQuestionPath = `table/fastshop/cajamar-audio/duvidas.ogg`
          //   mediaQuestion     = MessageMedia.fromFilePath(audioQuestionPath);
          //   await this.client.sendMessage(chatId, media);
          //   await this.client.sendMessage(chatId, mediaApresentation);
          //   await this.client.sendMessage(chatId, mediaQuestion);
          //   sendMessage = `*Pré-requisitos*\n\n✅ *Ajudante* (+ 18 Anos) \n\n*2-* aceitar \n*1-* voltar as operações\n\n*0-* Falar com suporte`
          //   // sendMessage = `*Pré-requisitos*\n\n✅ *Altura interna Baú 2,10* \n✅ *Ajudante* (+ 18 Anos)\n✅ *Carrinho para Entrega*\n✅ Veículo precisa de instalação *EVA/Espaguete*\n \n\n*2-* aceitar \n*1-* voltar as operações\n\n*0-* Falar com suporte`
          //   await this.client.sendMessage(chatId, sendMessage);
          //   await this.updateConversationStateTwo(chatId, 'DECISION_PROPOSAL');
          //   return;
      //     case '':
      //       sendMessage = `*Vila Leopoldina/SP*\n\n🍽️ *Operação:* Restaurantes\n📍 *Local:* Vila Leopoldina/SP\n🕑 *Período:* Segunda a Sábado\n🚚 *Carregamento:* Por agenda\n📦 *Produto:* Alimentos`
      //       await this.client.sendMessage(chatId, sendMessage);
      //       sendMessage = `*Epi's*\n\n🛒 *Carrinho para carga*\n🦺 *Colete*\n🥾 *Bota*`
      //       await this.client.sendMessage(chatId, sendMessage);
      //       sendMessage = `*Pagamento*\n\nPeríodo semanal 📅\n📌 1° Pagamento com 15 dias\nDemais pagamentos 💰\n📌 Fluxo Semanal\n\n0 a 75Km = R$ 350,00\n📍 Add entrega R$ 5,00\n 📦 + 21 entregas`
      //       await this.client.sendMessage(chatId, sendMessage);
      //       sendMessage = `*2-* aceitar \n*1-* voltar as operações\n\n*0-* Falar com atendente`
      //       await this.client.sendMessage(chatId, sendMessage);
      //       await this.updateConversationStateTwo(chatId, 'DECISION_PROPOSAL');
      //       return;
      //     case '':
      //       sendMessage = `*Santo André/SP*\n\n🍽️ *Operação:* Restaurantes\n📍 *Local:* Santo André/SP\n🕑 *Período:* Segunda a Sábado\n🚚 *Carregamento:* Por agenda\n📦 *Produto:* Alimentos`
      //       await this.client.sendMessage(chatId, sendMessage);
      //       sendMessage = `*Epi's*\n\n🛒 *Carrinho para carga*\n🦺 *Colete*\n🥾 *Bota*`
      //       await this.client.sendMessage(chatId, sendMessage);
      //       sendMessage = `*Pagamento*\n\nPeríodo semanal 📅\n📌 1° Pagamento com 15 dias\nDemais pagamentos 💰\n📌 Fluxo Semanal\n\n0 a 75Km = R$ 350,00\n📍 Add entrega R$ 5,00\n 📦 + 21 entregas`
      //       await this.client.sendMessage(chatId, sendMessage);
      //       sendMessage = `*2-* aceitar \n*1-* voltar as operações\n\n*0-* Falar com atendente`
      //       await this.client.sendMessage(chatId, sendMessage);
      //       await this.updateConversationStateTwo(chatId, 'DECISION_PROPOSAL');
      //       return;
          case '0':
            await this.client.sendMessage(chatId,'os nossos atendentes vão continuar com o seu atendimento 🤩')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['24'], [chatId])
            break
          default:
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            this.sendProposalOption(chatId)
            break;
        } 
        break;
      case 'hr':
        switch (message) {
          case '1':
            // Mensagem de Apresentação.
            sendMessage = `*Cajamar/SP*\n\nProposta de Operação - Mix Entregas\n🔥 Oportunidade exclusiva para motoristas com veículo adequado! 🔥\n\n📦 Operação Mensal – Entregas de Eletrônicos e Eletrodomésticos\n\n📍 Local: CD Cajamar\n⏰ Horário: Carregamento às 5h\n📅 Frequência: Mínimo 4 cargas máximo 6 cargas (Segunda a sábado)\n🛣️ KM: Considera trajeto ida e volta CD\n🍞☕ Benefício: Café da manhã incluso\n\n💡 *Diferenciais da Mix Entregas:*\n✅ Aplicativo exclusivo (Mix Entregas) para facilitar programação e pagamentos\n✅ Pedágio reembolsado via Sem Parar\n✅ Convênio de abastecimento com desconto na quinzena\n\n💰 Pagamento transparente e garantido\n\n📅 *Fechamento e repasse:*\n🔹 01 a 15: Pagamento dia 02 do mês seguinte\n🔹 16 a 30: Pagamento dia 16 do mês seguinte`
            await this.client.sendMessage(chatId, sendMessage);
            // Mensage de Apresentação.
            sendMessage =`🚛 *Requisitos do Veículo:*\n✔️ Baú com altura mínima 2,10m\n✔️ Veículo com instalação de EVA/Espaguete\n✔️ Ajudante obrigatório (idade mínima 18 anos)\n\n🔒 *Cadastro Rápido e Seguro!*\n📌 Documentação necessária:\n📍 Veículo: RG/CPF do proprietário, documento do veículo, ANTT\n📍 Motorista: CNH, RG, CPF, comprovante de endereço, telefone, e-mail\n📍 Ajudante: RG, CPF, CNH (opcional), telefone, e-mail\n\n🏦 Dados Bancários para Pagamento\n🔹 PIX: __\n\n*🚀 Vagas Limitadas! Cadastre-se agora e garanta sua operação!*`
            await this.client.sendMessage(chatId, sendMessage);

            // Audio Apresentação
            // audioApresentationPath = `table/fastshop/cajamar-audio/apresentação.ogg`
            // mediaApresentation = MessageMedia.fromFilePath(audioApresentationPath);
            // await this.client.sendMessage(chatId, mediaApresentation);
 
            // Mensagem de Tabela de Ganhos
            sendMessage = `*🚛 Tabela de Ganhos – Operação HR e Similares 2025*\n\n*💰 Quanto você pode ganhar?*\n🔹 Seu pagamento é baseado na quilometragem rodada e se o veículo possui rastreador. Com rastreador, você recebe mais!\n🔹 A tabela contempla KM IDA E VOLTA, porém não precisa retornar para o CD, mesmo que tenha devoluções, as devoluções serão realizadas no dia seguinte.\n\n📊 Confira os valores por faixa de KM rodado:`
            await this.client.sendMessage(chatId, sendMessage);
 
            // Imagem da Tabela
            imagePath =  `table/fastshop/cajamar-hr.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            await this.client.sendMessage(chatId, media);
 
            // Mensagem de Média de Faturamento
            // sendMessage = `*🔹 Valor do frete já está incluso o Ajudante!*\n°📢 Média de Faturamento Exemplo:\n\n1ª Faixa 10 Fretes mês= R$ 6.000,00\n2ª Faixa 5 Fretes mês= R$ 3.250,00\n3ª Faixa 5 Fretes mês= R$ 3.500,00\n4ª Faixa 5 Fretes mês= R$ 4.000,00\n5ª Faixa 5 Fretes mês= R$ 4.750,00\n\n📢 Bônus por volume:\n🔹 + R$10,00 por entrega acima de 14!\n\n🚀 Quanto mais você roda, mais ganha! Entre em contato e garanta sua vaga agora!`
            // await this.client.sendMessage(chatId, sendMessage);
 
             
             
            //Antiga Apresentação
            // sendMessage = `*Cajamar/SP*\n\n🚪 Operação: porta a porta\n📍 Local: Cajamar/SP\n🕑 Período: Segunda a Sábado\n🚚 Carregamento: 5:00h  \n🚧 Pedágio: reembolso pedágio no sem parar.\n📦 Produto: eletrônico/eletrodomésticos`
            // await this.client.sendMessage(chatId, sendMessage);
            // sendMessage = `*Benefícios*\n\n☕ café da manhã\n📱 App\n💰 Adiantamento\n⛽ Convênio Posto`
            // await this.client.sendMessage(chatId, sendMessage);
            // sendMessage = `*Pagamento*\n\n*1° Quinzena, considera o período ( 01 a 15)* Paga dia 02 do mês subsequente\n*2° Quinzena, considera o período ( 16 a 31)* Paga dia 16 do mês subsequente`
            // await this.client.sendMessage(chatId, sendMessage);
             
            // Audio Duvidas
            // audioQuestionPath = `table/fastshop/cajamar-audio/duvidas.ogg`
            // mediaQuestion     = MessageMedia.fromFilePath(audioQuestionPath);
            // await this.client.sendMessage(chatId, mediaQuestion);

            // Mensagem de Ação
            sendMessage = `*3-* aceitar \n*1-* voltar as operações\n\n\n*0-* Falar com suporte`
            await this.client.sendMessage(chatId, sendMessage);
            await this.updateConversationStateTwo(chatId, 'DECISION_PROPOSAL');
            break;
          case '2':
            sendMessage = `*Uberlândia/MG*\n\n🚪 Operação: porta a porta\n📍 Local: Uberlândia/MG\n🕑 Período: Segunda a Sábado\n🚚 Carregamento: 5:00h  \n🚧 Pedágio: reembolso pedágio no sem parar.\n📦 Produto: eletrônico/eletrodomésticos`
            await this.client.sendMessage(chatId, sendMessage);
            sendMessage = `*Benefícios*\n\n☕ café da manhã\n📱 App\n💰 Adiantamento`
            await this.client.sendMessage(chatId, sendMessage);
            sendMessage = `*Pagamento*\n\n*1° Quinzena, considera o período ( 01 a 15)* Paga dia 02 do mês subsequente\n*2° Quinzena, considera o período ( 16 a 31)* Paga dia 16 do mês subsequente`
            await this.client.sendMessage(chatId, sendMessage);
            imagePath =  `table/fastshop/uberlandia-contagem-vuc-hr.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            await this.client.sendMessage(chatId, media);
            sendMessage = `*Pré-requisitos*\n\n *Ajudante* (+ 18 Anos) \n\n\n*3-* aceitar \n*1-* voltar as operações\n\n*0-* Falar com suporte`
            await this.client.sendMessage(chatId, sendMessage);
            await this.updateConversationStateTwo(chatId, 'DECISION_PROPOSAL');
            break;
          case '3':
            sendMessage = `*Contagem/MG*\n\n🚪 Operação: porta a porta\n📍 Local: Contagem/MG\n🕑 Período: Segunda a Sábado\n🚚 Carregamento: 5:00h  \n🚧 Pedágio: reembolso pedágio no sem parar.\n📦 Produto: eletrônico/eletrodomésticos`
            await this.client.sendMessage(chatId, sendMessage);
            sendMessage = `*Benefícios*\n\n☕ café da manhã\n📱 App\n💰 Adiantamento`
            await this.client.sendMessage(chatId, sendMessage);
            sendMessage = `*Pagamento*\n\n*1° Quinzena, considera o período ( 01 a 15)* Paga dia 02 do mês subsequente\n*2° Quinzena, considera o período ( 16 a 31)* Paga dia 16 do mês subsequente`
            await this.client.sendMessage(chatId, sendMessage);
            imagePath =  `table/fastshop/uberlandia-contagem-vuc-hr.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            await this.client.sendMessage(chatId, media);
            sendMessage = `*Pré-requisitos*\n\n ✅ *Ajudante* (+ 18 Anos) \n\n\n*3-* aceitar \n*1-* voltar as operações\n\n*0-* Falar com suporte`
            await this.client.sendMessage(chatId, sendMessage);
            await this.updateConversationStateTwo(chatId, 'DECISION_PROPOSAL');
            break;         
          case '0':
            await this.client.sendMessage(chatId,'os nossos atendentes vão continuar com o seu atendimento 🤩')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['24'], [chatId])
            break
          default:
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            this.sendProposalOption(chatId)
            break;
        }
        break;
      case 'vuc':
        switch (message) {
          case '1':
            // Mensagem de Apresentação.
            sendMessage = `*Cajamar/SP*\n\nProposta de Operação - Mix Entregas\n🔥 Oportunidade exclusiva para motoristas com veículo adequado! 🔥\n\n📦 Operação Mensal – Entregas de Eletrônicos e Eletrodomésticos\n\n📍 Local: CD Cajamar\n⏰ Horário: Carregamento às 5h\n📅 Frequência: Mínimo 4 cargas máximo 6 cargas (Segunda a sábado)\n🛣️ KM: Considera trajeto ida e volta CD\n🍞☕ Benefício: Café da manhã incluso\n\n💡 *Diferenciais da Mix Entregas:*\n✅ Aplicativo exclusivo (Mix Entregas) para facilitar programação e pagamentos\n✅ Pedágio reembolsado via Sem Parar\n✅ Convênio de abastecimento com desconto na quinzena\n\n💰 Pagamento transparente e garantido\n\n📅 *Fechamento e repasse:*\n🔹 01 a 15: Pagamento dia 02 do mês seguinte\n🔹 16 a 30: Pagamento dia 16 do mês seguinte`
            await this.client.sendMessage(chatId, sendMessage);
            // Mensage de Apresentação.
            sendMessage =`🚛 *Requisitos do Veículo:*\n✔️ Baú com altura mínima 2,10m\n✔️ Veículo com instalação de EVA/Espaguete\n✔️ Ajudante obrigatório (idade mínima 18 anos)\n\n🔒 *Cadastro Rápido e Seguro!*\n📌 Documentação necessária:\n📍 Veículo: RG/CPF do proprietário, documento do veículo, ANTT\n📍 Motorista: CNH, RG, CPF, comprovante de endereço, telefone, e-mail\n📍 Ajudante: RG, CPF, CNH (opcional), telefone, e-mail\n\n🏦 Dados Bancários para Pagamento\n🔹 PIX: __\n\n*🚀 Vagas Limitadas! Cadastre-se agora e garanta sua operação!*`
            await this.client.sendMessage(chatId, sendMessage);

            // Audio Apresentação
            // audioApresentationPath = `table/fastshop/cajamar-audio/apresentação.ogg`
            // mediaApresentation = MessageMedia.fromFilePath(audioApresentationPath);
            // await this.client.sendMessage(chatId, mediaApresentation);

            // Mensagem de Tabela de Ganhos
            sendMessage = `*🚛 Tabela de Ganhos – Operação VUC 2025*\n\n*💰 Quanto você pode ganhar?*\n🔹 Seu pagamento é baseado na quilometragem rodada e se o veículo possui rastreador. Com rastreador, você recebe mais!\n🔹 A tabela contempla KM IDA E VOLTA, porém não precisa retornar para o CD, mesmo que tenha devoluções, as devoluções serão realizadas no dia seguinte.\n\n📊 Confira os valores por faixa de KM rodado:`
            await this.client.sendMessage(chatId, sendMessage);

            // Imagem da Tabela
            imagePath =  `table/fastshop/cajamar-vuc.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            await this.client.sendMessage(chatId, media);

            // Mensagem de Média de Faturamento
            // sendMessage = `*🔹 Valor do frete já está incluso o Ajudante!*\n°📢 Média de Faturamento Exemplo:\n\n1ª Faixa 10 Fretes mês= R$ 6.500,00\n2ª Faixa 5 Fretes mês= R$ 3.500,00\n3ª Faixa 5 Fretes mês= R$ 3.750,00\n4ª Faixa 5 Fretes mês= R$ 4.500,00\n5ª Faixa 5 Fretes mês= R$ 5.000,00\n\n📢 Bônus por volume:\n🔹 + R$10,00 por entrega acima de 14!\n\n🚀 Quanto mais você roda, mais ganha! Entre em contato e garanta sua vaga agora!`
            // await this.client.sendMessage(chatId, sendMessage);

            
            
            //Antiga Apresentação
            // sendMessage = `*Cajamar/SP*\n\n🚪 Operação: porta a porta\n📍 Local: Cajamar/SP\n🕑 Período: Segunda a Sábado\n🚚 Carregamento: 5:00h  \n🚧 Pedágio: reembolso pedágio no sem parar.\n📦 Produto: eletrônico/eletrodomésticos`
            // await this.client.sendMessage(chatId, sendMessage);
            // sendMessage = `*Benefícios*\n\n☕ café da manhã\n📱 App\n💰 Adiantamento\n⛽ Convênio Posto`
            // await this.client.sendMessage(chatId, sendMessage);
            // sendMessage = `*Pagamento*\n\n*1° Quinzena, considera o período ( 01 a 15)* Paga dia 02 do mês subsequente\n*2° Quinzena, considera o período ( 16 a 31)* Paga dia 16 do mês subsequente`
            // await this.client.sendMessage(chatId, sendMessage);
            
            
           
            // Audio Duvidas
            // audioQuestionPath = `table/fastshop/cajamar-audio/duvidas.ogg`
            // mediaQuestion     = MessageMedia.fromFilePath(audioQuestionPath);
            // await this.client.sendMessage(chatId, mediaQuestion);

            // Mensagem de Ação
            sendMessage = `*2-* aceitar \n*1-* voltar as operações\n\n*0-* Falar com suporte`
            await this.client.sendMessage(chatId, sendMessage);
            await this.updateConversationStateTwo(chatId, 'DECISION_PROPOSAL');
            
            // Teste de Apresentação 
            // sendMessage = `📦 *Leve seu negócio de entregas para o próximo nível com a Mix Entregas!* 🚀\n\nOlá, somos a Mix serv log | Entregas\nJá realizamos mais de 🚚 +2 milhões Entregas por todo Brasil 👇 Conheça mais sobre nós\n*Site:* https://www.mixentregas.com.br/\n*Instagram:*\nhttps://www.instagram.com/mixservlog/`
            // await this.client.sendMessage(chatId, sendMessage);
            // imagePath =  `table/fastshop/pack/cajamar-vuc.jpeg`;
            // media = MessageMedia.fromFilePath(imagePath);
            // await this.client.sendMessage(chatId, media);
            // sendMessage = `🛣️ Pacotes de frete mensal feitos sob medida para você:\n\n*•	(10 frete)  0 até 180 km: R$ 3.000,00*\n*•	(5 fretes ) 181 a 250 km: R$ 3.500,00*\n*•	(5 fretes) 251 a 350 km: R$ 3.750,00*\n\n✅ Sobre o Pacote de Fretes\n\n*•	Como Será realizada as entregas: Via Aplicativo*\n*•	A carga Contempla Seguro contra Roubo/Furto*\n*•	Carga Seca*\n*•	O auxiliar é por conta do prestador dos serviços*\n*•	Os Pedágios serão pagos a parte do frete no sem parar*\n*•	Os pagamentos serão via app*\n\n📲 Quer garantir suas entregas mensais sem imprevistos?\nFale conosco agora: www.mixentregas.com.br\n\n🚚 *Mix Entregas*\n O Futuro das Entregas Começa Aqui!`;
            // await this.client.sendMessage(chatId, sendMessage);
            // sendMessage = `*2-* aceitar \n*1-* voltar as operações\n\n*0-* Falar com suporte`
            // await this.client.sendMessage(chatId, sendMessage);
            // await this.updateConversationStateTwo(chatId, 'DECISION_PROPOSAL');
            break;
          case '2':
            sendMessage = `*Barueri/SP*\n\n🏪 *Operação:* Abastecimento de loja\n📍 *Local:* Barueri/SP\n📈 *Quantidade de Entregas:* 1 a 3 (média)\n🗓️ *Período:* Semanal\n🕑 *Horário Carregamento:* A partir das 4h (agendamento)\n🚚 *Carregamento:* Por agenda\n📦 *Produto:* Diversos\n🚧 *Pedágio:* Reembolso na fatura\n🗺️ *Rastreador:* Ominilink, Sascar e Onixsat \n\n ❌ *Não precisa de Ajudante*\n✔️ *Precisa deixar o veículo no CD para ser carregado*`
            await this.client.sendMessage(chatId, sendMessage);
            sendMessage = `*Pagamento*\n\n*1° Quinzena, considera o período ( 01 a 15)* \n💰 Paga dia 02 do mês subsequente\n\n*2° Quinzena, considera o período ( 16 a 31)*\n💰 Paga dia 16 do mês subsequente`
            await this.client.sendMessage(chatId, sendMessage);
            imagePath =  `table/americanas/vuc.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            await this.client.sendMessage(chatId, media);
            sendMessage = `*3-* aceitar \n*1-* voltar as operações\n\n*0-* Falar com atendente`
            await this.client.sendMessage(chatId, sendMessage);
            await this.updateConversationStateTwo(chatId, 'DECISION_PROPOSAL');
            return;
          case '3':
            sendMessage = `*Uberlândia/MG*\n\n🚪 Operação: porta a porta\n📍 Local: Uberlândia/MG\n🕑 Período: Segunda a Sábado\n🚚 Carregamento: 5:00h  \n🚧 Pedágio: reembolso pedágio no sem parar.\n📦 Produto: eletrônico/eletrodomésticos`
            await this.client.sendMessage(chatId, sendMessage);
            sendMessage = `*Benefícios*\n\n☕ café da manhã\n📱 App\n💰 Adiantamento`
            await this.client.sendMessage(chatId, sendMessage);
            sendMessage = `*Pagamento*\n\n*1° Quinzena, considera o período ( 01 a 15)* Paga dia 02 do mês subsequente\n*2° Quinzena, considera o período ( 16 a 31)* Paga dia 16 do mês subsequente`
            await this.client.sendMessage(chatId, sendMessage);
            imagePath =  `table/fastshop/uberlandia-contagem-vuc-hr.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            await this.client.sendMessage(chatId, media);
            sendMessage = `*Pré-requisitos*\n\n✅ *Ajudante* (+ 18 Anos) \n\n\n*2-* aceitar \n*1-* voltar as operações\n\n*0-* Falar com suporte`
            await this.client.sendMessage(chatId, sendMessage);
            await this.updateConversationStateTwo(chatId, 'DECISION_PROPOSAL');
            break;
          case '4':
            sendMessage = `*Contagem/MG*\n\n🚪 Operação: porta a porta\n📍 Local: Contagem/MG\n🕑 Período: Segunda a Sábado\n🚚 Carregamento: 5:00h  \n🚧 Pedágio: reembolso pedágio no sem parar.\n📦 Produto: eletrônico/eletrodomésticos`
            await this.client.sendMessage(chatId, sendMessage);
            sendMessage = `*Benefícios*\n\n☕ café da manhã\n📱 App\n💰 Adiantamento`
            await this.client.sendMessage(chatId, sendMessage);
            sendMessage = `*Pagamento*\n\n*1° Quinzena, considera o período ( 01 a 15)* Paga dia 02 do mês subsequente\n*2° Quinzena, considera o período ( 16 a 31)* Paga dia 16 do mês subsequente`
            await this.client.sendMessage(chatId, sendMessage);
            imagePath =  `table/fastshop/uberlandia-contagem-vuc-hr.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            await this.client.sendMessage(chatId, media);
            sendMessage = `*Pré-requisitos*\n\n✅ *Ajudante* (+ 18 Anos)\n\n\n*2-* aceitar \n*1-* voltar as operações\n\n*0-* Falar com suporte`
            await this.client.sendMessage(chatId, sendMessage);
            await this.updateConversationStateTwo(chatId, 'DECISION_PROPOSAL');
            break;       
          case '0':
            await this.client.sendMessage(chatId,'os nossos atendentes vão continuar com o seu atendimento 🤩')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['24'], [chatId])
            break
          default:
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            this.sendProposalOption(chatId)
            break;
        }
        break;
      case '3/4':
        switch (message) {
          case '1':
            sendMessage = `*Barueri/SP*\n\n🏪 *Operação:* Abastecimento de loja\n📍 *Local:* Barueri/SP\n📈 *Quantidade de Entregas:* 1 a 3 (média)\n🗓️ *Período:* Semanal\n🕑 *Horário Carregamento:* A partir das 4h (agendamento)\n🚚 *Carregamento:* Por agenda\n📦 *Produto:* Diversos\n🚧 *Pedágio:* Reembolso na fatura\n🗺️ *Rastreador:* Ominilink, Sascar e Onixsat \n\n ❌ *Não precisa de Ajudante*\n✔️ *Precisa deixar o veículo no CD para ser carregado*`
            await this.client.sendMessage(chatId, sendMessage);
            sendMessage = `*Pagamento*\n\n*1° Quinzena, considera o período ( 01 a 15)* \n💰 Paga dia 02 do mês subsequente\n\n*2° Quinzena, considera o período ( 16 a 31)*\n💰 Paga dia 16 do mês subsequente`
            await this.client.sendMessage(chatId, sendMessage);
            imagePath =  `table/americanas/34.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            await this.client.sendMessage(chatId, media);
            sendMessage = `*3-* aceitar \n*1-* voltar as operações\n\n*0-* Falar com atendente`
            await this.client.sendMessage(chatId, sendMessage);
            await this.updateConversationStateTwo(chatId, 'DECISION_PROPOSAL');
            break;
          // case '2':
          //   sendMessage = `*Contagem/MG*\n\n🚪 Operação: porta a porta\n📍 Local: Contagem/MG\n🕑 Período: Segunda a Sábado\n🚚 Carregamento: 5:00h  \n🚧 Pedágio: reembolso pedágio no sem parar.\n📦 Produto: eletrônico/eletrodomésticos`
          //   await this.client.sendMessage(chatId, sendMessage);
          //   sendMessage = `*Benefícios*\n\n☕ café da manhã\n📱 App\n💰 Adiantamento`
          //   await this.client.sendMessage(chatId, sendMessage);
          //   sendMessage = `*Pagamento*\n\n*1° Quinzena, considera o período ( 01 a 15)* Paga dia 02 do mês subsequente\n*2° Quinzena, considera o período ( 16 a 31)* Paga dia 16 do mês subsequente`
          //   await this.client.sendMessage(chatId, sendMessage);
          //   imagePath =  `table/fastshop/uberlandia-contagem-vuc-hr.jpeg`;
          //   media = MessageMedia.fromFilePath(imagePath);
          //   await this.client.sendMessage(chatId, media);
          //   sendMessage = `*Pré-requisitos*\n\n✅ *Comprimentro menor* de 5,00 \n✅ *Ajudante* (+ 18 Anos)\n✅ *Carrinho para Entrega*\n✅ Veículo precisa de instalação *EVA/Espaguete*\n \n\n*2-* aceitar \n*1-* voltar as operações\n\n*0-* Falar com suporte`
          //   await this.client.sendMessage(chatId, sendMessage);
          //   await this.updateConversationStateTwo(chatId, 'DECISION_PROPOSAL');
          //   break;
          // case '3':
          //   sendMessage = `*Uberlândia/MG*\n\n🚪 Operação: porta a porta\n📍 Local: Uberlândia/MG\n🕑 Período: Segunda a Sábado\n🚚 Carregamento: 5:00h  \n🚧 Pedágio: reembolso pedágio no sem parar.\n📦 Produto: eletrônico/eletrodomésticos`
          //   await this.client.sendMessage(chatId, sendMessage);
          //   sendMessage = `*Benefícios*\n\n☕ café da manhã\n📱 App\n💰 Adiantamento`
          //   await this.client.sendMessage(chatId, sendMessage);
          //   sendMessage = `*Pagamento*\n\n*1° Quinzena, considera o período ( 01 a 15)* Paga dia 02 do mês subsequente\n*2° Quinzena, considera o período ( 16 a 31)* Paga dia 16 do mês subsequente`
          //   await this.client.sendMessage(chatId, sendMessage);
          //   imagePath =  `table/fastshop/uberlandia-contagem-vuc-hr.jpeg`;
          //   media = MessageMedia.fromFilePath(imagePath);
          //   await this.client.sendMessage(chatId, media);
          //   sendMessage = `*Pré-requisitos*\n\n✅ *Comprimentro menor* de 5,00\n✅ *Ajudante* (+ 18 Anos)\n✅ *Carrinho para Entrega*\n✅ Veículo precisa de instalação *EVA/Espaguete*\n \n\n*2-* aceitar \n*1-* voltar as operações\n\n*0-* Falar com suporte`
          //   await this.client.sendMessage(chatId, sendMessage);
          //   await this.updateConversationStateTwo(chatId, 'DECISION_PROPOSAL');
          //   break;
          case '0':
            await this.client.sendMessage(chatId,'os nossos atendentes vão continuar com o seu atendimento 🤩')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['24'], [chatId])
            break
          default:
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            this.sendProposalOption(chatId)
            break;
        }
        break;
      case 'toco':
        switch (message) {
          case '1':
            sendMessage = `*Barueri/SP*\n\n🏪 *Operação:* Abastecimento de loja\n📍 *Local:* Barueri/SP\n� *Quantidade de Entregas:* 1 a 3 (média)\n🗓️ *Período:* Semanal\n🕑 *Horário Carregamento:* A partir das 4h (agendamento)\n🚚 *Carregamento:* Por agenda\n📦 *Produto:* Diversos\n🚧 *Pedágio:* Reembolso na fatura\n🗺️ *Rastreador:* Ominilink, Sascar e Onixsat \n\n ❌ *Não precisa de Ajudante*\n✔️ *Precisa deixar o veículo no CD para ser carregado*`
            await this.client.sendMessage(chatId, sendMessage);
            sendMessage = `*Pagamento*\n\n*1° Quinzena, considera o período ( 01 a 15)* \n💰 Paga dia 02 do mês subsequente\n\n*2° Quinzena, considera o período ( 16 a 31)*\n💰 Paga dia 16 do mês subsequente`
            await this.client.sendMessage(chatId, sendMessage);
            imagePath =  `table/americanas/toco.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            await this.client.sendMessage(chatId, media);
            sendMessage = `*2-* aceitar \n*1-* voltar as operações\n\n*0-* Falar com atendente`
            await this.client.sendMessage(chatId, sendMessage);
            await this.updateConversationStateTwo(chatId, 'DECISION_PROPOSAL');
            break;
          case '0':
            await this.client.sendMessage(chatId,'os nossos atendentes vão continuar com o seu atendimento 🤩')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['24'], [chatId])
            break
          default:
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            this.sendProposalOption(chatId)
            break;
        }
        break;
      case 'truck':
        switch (message) {
          case '1':
            sendMessage = `*Barueri/SP*\n\n🏪 *Operação:* Abastecimento de loja\n📍 *Local:* Barueri/SP\n� *Quantidade de Entregas:* 1 a 3 (média)\n🗓️ *Período:* Semanal\n🕑 *Horário Carregamento:* A partir das 4h (agendamento)\n🚚 *Carregamento:* Por agenda\n📦 *Produto:* Diversos\n🚧 *Pedágio:* Reembolso na fatura\n🗺️ *Rastreador:* Ominilink, Sascar e Onixsat \n\n ❌ *Não precisa de Ajudante*\n✔️ *Precisa deixar o veículo no CD para ser carregado*`
            await this.client.sendMessage(chatId, sendMessage);
            sendMessage = `*Pagamento*\n\n*1° Quinzena, considera o período ( 01 a 15)* \n💰 Paga dia 02 do mês subsequente\n\n*2° Quinzena, considera o período ( 16 a 31)*\n💰 Paga dia 16 do mês subsequente`
            await this.client.sendMessage(chatId, sendMessage);
            imagePath =  `table/americanas/truck.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            await this.client.sendMessage(chatId, media);
            sendMessage = `*2-* aceitar \n*1-* voltar as operações\n\n*0-* Falar com atendente`
            await this.client.sendMessage(chatId, sendMessage);
            await this.updateConversationStateTwo(chatId, 'DECISION_PROPOSAL');
            break;
          case '0':
            await this.client.sendMessage(chatId,'os nossos atendentes vão continuar com o seu atendimento 🤩')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['24'], [chatId])
            break
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
            this.sendProposalOption(chatId)
            await this.updateConversationStateTwo(chatId, 'PROPOSAL');
            break;
          case '2':
            await this.client.sendMessage(chatId,'*Ótimo* 🙌🏾\nagora precisa de mais *1* passo\n\nenviar os documentos necessarios 📄')
            message = `*Fotos do Veículo (documentos)*\n\n✅CRLV\n✅ANTT\n\n*Fotos do Motorista (documentos)*\n\n✅CNH\n✅Comprovante de endereço\n\n*Fotos do Proprietário do Veículo (documentos)*\n\n✅RG ou CNH\n✅Comprovante de endereço\n✅Celular\n\n*Caso o cadastro do carro for jurídico*\n\n✅CNPJ\n✅Inscrição Estadual`
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
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            break;
        }
        break;
      case 'van':
        switch (message) {
          case '1':
            this.sendProposalOption(chatId)
            await this.updateConversationStateTwo(chatId, 'PROPOSAL');
            break
          case '2':
            await this.client.sendMessage(chatId,'*Ótimo* 🙌🏾\nagora precisa de mais *1* passo\n\nenviar os documentos necessarios 📄')
            message = `*Fotos do Veículo (documentos)*\n\n✅CRLV\n✅ANTT\n\n*Fotos do Motorista (documentos)*\n\n✅CNH\n✅Comprovante de endereço\n\n*Fotos do Proprietário do Veículo (documentos)*\n\n✅RG ou CNH\n✅Comprovante de endereço\n✅Celular\n\n*Fotos do Auxiliar (documentos)*\n\n✅RG ou CNH\n✅Comprovante de endereço\n✅Celular\n\n*Caso o cadastro do carro for jurídico*\n\n✅CNPJ\n✅Inscrição Estadual`
            await this.client.sendMessage(chatId,message)
            await this.client.sendMessage(chatId,'*Por gentileza enviar as fotos bem legível* 🤳🏾')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['25'], [chatId])
            await this.updateConversationStateTwo(chatId, 'APPROVED');
            break
          case '0':
              await this.client.sendMessage(chatId,'os nossos atendentes vão continuar com o seu atendimento 🤩')
              await this.client.addOrRemoveLabels([], [chatId])
              this.client.addOrRemoveLabels(['24'], [chatId])
              break;
          default:
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            break;
        } 
        break;
      case 'hr':
        switch (message) {
          case '1':
            this.sendProposalOption(chatId)
            await this.updateConversationStateTwo(chatId, 'PROPOSAL');
            break
          case '2':
            await this.client.sendMessage(chatId,'*Ótimo* 🙌🏾\nagora precisa de mais *1* passo\n\nenviar os documentos necessarios 📄')
            message = `*Fotos do Veículo (documentos)*\n\n✅CRLV\n✅ANTT\n\n*Fotos do Motorista (documentos)*\n\n✅CNH\n✅Comprovante de endereço\n\n*Fotos do Proprietário do Veículo (documentos)*\n\n✅RG ou CNH\n✅Comprovante de endereço\n✅Celular\n\n*Caso o cadastro do carro for jurídico*\n\n✅CNPJ\n✅Inscrição Estadual`
            await this.client.sendMessage(chatId,message)
            await this.client.sendMessage(chatId,'*Por gentileza enviar as fotos bem legível* 🤳🏾')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['25'], [chatId])
            await this.updateConversationStateTwo(chatId, 'APPROVED');
            break
          case '3':
            await this.client.sendMessage(chatId,'*Ótimo* 🙌🏾\nagora precisa de mais *1* passo\n\nenviar os documentos necessarios 📄')
            message = `*Fotos do Veículo (documentos)*\n\n✅CRLV\n✅ANTT\n\n*Fotos do Motorista (documentos)*\n\n✅CNH\n✅Comprovante de endereço\n\n*Fotos do Proprietário do Veículo (documentos)*\n\n✅RG ou CNH\n✅Comprovante de endereço\n✅Celular\n\n*Fotos do Auxiliar (documentos)*\n\n✅RG ou CNH\n✅Comprovante de endereço\n✅Celular\n\n*Caso o cadastro do carro for jurídico*\n\n✅CNPJ\n✅Inscrição Estadual`
            await this.client.sendMessage(chatId,message)
            await this.client.sendMessage(chatId,'*Por gentileza enviar as fotos bem legível* 🤳🏾')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['25'], [chatId])
            await this.updateConversationStateTwo(chatId, 'APPROVED');
            break
          case '0':
            await this.client.sendMessage(chatId,'os nossos atendentes vão continuar com o seu atendimento 🤩')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['24'], [chatId])
            break;
          default:
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            break;
        }
        break;
      case 'vuc':
        switch (message) {
          case '1':
            this.sendProposalOption(chatId)
            await this.updateConversationStateTwo(chatId, 'PROPOSAL');
            break
          case '2':
            await this.client.sendMessage(chatId,'*Ótimo* 🙌🏾\nagora precisa de mais *1* passo\n\nenviar os documentos necessarios 📄')
            message = `*Fotos do Veículo (documentos)*\n\n✅CRLV\n✅ANTT\n\n*Fotos do Motorista (documentos)*\n\n✅CNH\n✅Comprovante de endereço\n\n*Fotos do Proprietário do Veículo (documentos)*\n\n✅RG ou CNH\n✅Comprovante de endereço\n✅Celular\n\n*Fotos do Auxiliar (documentos)*\n\n✅RG ou CNH\n✅Comprovante de endereço\n✅Celular\n\n*Caso o cadastro do carro for jurídico*\n\n✅CNPJ\n✅Inscrição Estadual`
            await this.client.sendMessage(chatId,message)
            await this.client.sendMessage(chatId,'*Por gentileza enviar as fotos bem legível* 🤳🏾')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['25'], [chatId])
            await this.updateConversationStateTwo(chatId, 'APPROVED');
            break
          case '3':
            await this.client.sendMessage(chatId,'*Ótimo* 🙌🏾\nagora precisa de mais *1* passo\n\nenviar os documentos necessarios 📄')
            message = `*Fotos do Veículo (documentos)*\n\n✅CRLV\n✅ANTT\n✅ 3 Referências de telefone (Motorista/ Proprietário do veículo) \n\n*Fotos do Motorista (documentos)*\n\n✅CNH\n✅Comprovante de endereço\n\n*Fotos do Proprietário do Veículo (documentos)*\n\n✅RG ou CNH\n✅Comprovante de endereço\n✅Celular\n\n*Caso o cadastro do carro for jurídico*\n\n✅CNPJ\n✅Inscrição Estadual`
            await this.client.sendMessage(chatId,message)
            await this.client.sendMessage(chatId,'*Por gentileza enviar as fotos bem legível* 🤳🏾')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['25'], [chatId])
            await this.updateConversationStateTwo(chatId, 'APPROVED');
            break
          case '0':
            await this.client.sendMessage(chatId,'os nossos atendentes vão continuar com o seu atendimento 🤩')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['24'], [chatId])
            break;
          default:
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            break;
        }
        break;
      case '3/4':
        switch (message) {
          case '1':
            this.sendProposalOption(chatId)
            await this.updateConversationStateTwo(chatId, 'PROPOSAL');
            break
          case '2':
            await this.client.sendMessage(chatId,'*Ótimo* 🙌🏾\nagora precisa de mais *1* passo\n\nenviar os documentos necessarios 📄')
            message = `*Fotos do Veículo (documentos)*\n\n✅CRLV\n✅ANTT\n\n*Fotos do Motorista (documentos)*\n\n✅CNH\n✅Comprovante de endereço\n\n*Fotos do Proprietário do Veículo (documentos)*\n\n✅RG ou CNH\n✅Comprovante de endereço\n✅Celular\n\n*Fotos do Auxiliar (documentos)*\n\n✅RG ou CNH\n✅Comprovante de endereço\n✅Celular\n\n*Caso o cadastro do carro for jurídico*\n\n✅CNPJ\n✅Inscrição Estadual`
            await this.client.sendMessage(chatId,message)
            await this.client.sendMessage(chatId,'*Por gentileza enviar as fotos bem legível* 🤳🏾')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['25'], [chatId])
            await this.updateConversationStateTwo(chatId, 'APPROVED');
            break
          case '3':
            await this.client.sendMessage(chatId,'*Ótimo* 🙌🏾\nagora precisa de mais *1* passo\n\nenviar os documentos necessarios 📄')
            message = `*Fotos do Veículo (documentos)*\n\n✅CRLV\n✅ANTT\n✅ 3 Referências de telefone (Motorista/ Proprietário do veículo) \n\n*Fotos do Motorista (documentos)*\n\n✅CNH\n✅Comprovante de endereço\n\n*Fotos do Proprietário do Veículo (documentos)*\n\n✅RG ou CNH\n✅Comprovante de endereço\n✅Celular\n\n*Caso o cadastro do carro for jurídico*\n\n✅CNPJ\n✅Inscrição Estadual`
            await this.client.sendMessage(chatId,message)
            await this.client.sendMessage(chatId,'*Por gentileza enviar as fotos bem legível* 🤳🏾')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['25'], [chatId])
            await this.updateConversationStateTwo(chatId, 'APPROVED');
            break
          case '0':
            await this.client.sendMessage(chatId,'os nossos atendentes vão continuar com o seu atendimento 🤩')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['24'], [chatId])
            break
          default:
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            break;
        }
        break;
      case 'toco':
        switch (message) {
          case '1':
            this.sendProposalOption(chatId)
            await this.updateConversationStateTwo(chatId, 'PROPOSAL');
            break;
          case '2':
            await this.client.sendMessage(chatId,'*Ótimo* 🙌🏾\nagora precisa de mais *1* passo\n\nenviar os documentos necessarios 📄')
            message = `*Fotos do Veículo (documentos)*\n\n✅CRLV\n✅ANTT\n✅ 3 Referências de telefone (Motorista/ Proprietário do veículo) \n\n*Fotos do Motorista (documentos)*\n\n✅CNH\n✅Comprovante de endereço\n\n*Fotos do Proprietário do Veículo (documentos)*\n\n✅RG ou CNH\n✅Comprovante de endereço\n✅Celular\n\n*Caso o cadastro do carro for jurídico*\n\n✅CNPJ\n✅Inscrição Estadual`
            await this.client.sendMessage(chatId,message)
            await this.client.sendMessage(chatId,'*Por gentileza enviar as fotos bem legível* 🤳🏾')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['25'], [chatId])
            await this.updateConversationStateTwo(chatId, 'APPROVED');
            break
          case '0':
            await this.client.sendMessage(chatId,'os nossos atendentes vão continuar com o seu atendimento 🤩')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['24'], [chatId])
            break
          default:
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            break;
        }
        break;
      case 'truck':
        switch (message) {
          case '1':
            this.sendProposalOption(chatId)
            await this.updateConversationStateTwo(chatId, 'PROPOSAL');
            break;
          case '2':
            await this.client.sendMessage(chatId,'*Ótimo* 🙌🏾\nagora precisa de mais *1* passo\n\nenviar os documentos necessarios 📄')
            message = `*Fotos do Veículo (documentos)*\n\n✅CRLV\n✅ANTT\n✅ 3 Referências de telefone (Motorista/ Proprietário do veículo) \n\n*Fotos do Motorista (documentos)*\n\n✅CNH\n✅Comprovante de endereço\n\n*Fotos do Proprietário do Veículo (documentos)*\n\n✅RG ou CNH\n✅Comprovante de endereço\n✅Celular\n\n*Caso o cadastro do carro for jurídico*\n\n✅CNPJ\n✅Inscrição Estadual`
            await this.client.sendMessage(chatId,message)
            await this.client.sendMessage(chatId,'*Por gentileza enviar as fotos bem legível* 🤳🏾')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['25'], [chatId])
            await this.updateConversationStateTwo(chatId, 'APPROVED');
            break
          case '0':
            await this.client.sendMessage(chatId,'os nossos atendentes vão continuar com o seu atendimento 🤩')
            await this.client.addOrRemoveLabels([], [chatId])
            this.client.addOrRemoveLabels(['24'], [chatId])
            break
          default:
            await this.client.sendMessage(chatId, "Não entendi 😵‍💫, vamos tentar de novo \n\n Me manda os números que correspondem, por favor! 🔢");
            break;
        }
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

  // Utils

  private async verifyCadaster(message:Message){
   const chatId = message.from;
    if (usersCheks[chatId]?.isVerified) {
      // console.log("Usuário já verificado, continuando o fluxo...");
      return; // Não executa a verificação novamente
    }

   const number = chatId.replace('@c.us', '');
   const lead = await this.leadService.findOnePhone(number)
  //  console.log(lead)
   if(lead.status == 200){
    this.userData[chatId] = {
      name: lead.result.name ,
      vehicle: lead.result.typeVehicle, 
      region: lead.result.region,
      measure: lead.result.measure,
      email: lead.result.email,
      tracker: lead.result.tracker,
    };
    if(!lead.result.typeVehicle || !lead.result.region || !lead.result.name){
      await this.handleIncomingMessage(message);
    }else{
      this.client.addOrRemoveLabels([''], [chatId])
      const confirmationMessage = `✍️ *Antes de apresentar as operações*\n📋📦 *As suas informações continuam correta?* \n\n😁 *Nome:* ${lead.result.name}\n📧 *Email:* ${lead.result.email} \n🚚 *Veículo:* ${lead.result.typeVehicle}\n📡 *Rastreador:* ${lead.result.tracker} \n📍 *Região:* ${lead.result.region}\n📐 *Medida:* ${lead.result.measure} \n\n*Está tudo correto 👀?* \nResponda com "sim" ou "não"`;
      setTimeout(() => {
        this.updateConversationStateOne(chatId, 'CONFIRMATION');
        this.client.sendMessage(chatId, confirmationMessage)
      }, 10000)
    }
    usersCheks[chatId] = { isVerified: true}
    setTimeout(() => {
      // console.log(`Resetando estado do usuário ${chatId}`);
      delete usersCheks[chatId];
    // }, 60000); // 1 minuto de inatividade
    }, 24 * 60 * 60 * 1000); // 24 horas em milissegundos
    return
   }
   usersCheks[chatId] = { isVerified: true }
   return await this.handleIncomingMessage(message);
  };

  private async sendProposal(message:Message){
    // console.log('chamando function envio em massa')
    const chatId = message.from;
    let order:string
    let cars : any
    let typeVehicleCount = {};
    let activeCount = 0;
    let bugs = 0
    const ordemMatch = message.body.match(/ordem:"([^"]+)"/);
    if (ordemMatch) {
      order = ordemMatch[1]; 
    }else{
      this.client.sendMessage(chatId, '*Match errado:* erro na ordem')
      return
    }

    const offerMessage = await this.generateOfferMessage(order);

    this.client.sendMessage(chatId, `*Aqui está uma copia da oferta:*`)
    await this.sendMessageWithDelay(chatId, offerMessage, 1000);
    // Regex para capturar a parte dos carros
    const carsMatch = message.body.match(/carros:([\w,]+)/);
    if (carsMatch) {
      const cars = carsMatch[1].split(',');
      if (cars.includes("todos")) {
        const allLeads = await this.leadService.findAll();
        const leadPhones = allLeads.map(lead => lead.phone);
        const whatsappContacts = await this.client.getContacts(); 
        const whatsappPhones = whatsappContacts.map(contact => contact.number); 
        const notInWhatsApp = leadPhones.filter(phone => !whatsappPhones.includes(phone));
        const notInDatabase = whatsappPhones.filter(phone => !leadPhones.includes(phone));
        const nonDuplicatedPhones = [...new Set([...notInWhatsApp, ...notInDatabase])];
        
        // for (const lead of nonDuplicatedPhones){
        //   const phoneRegex = /^55\d{11}$/;
        //   // if (!phoneRegex.test(lead.phone)) {
        //   //   bugs++;
        //   //   continue;
        //   // };

        //   // const labels = await this.client.getChatLabels(`${lead.phone}@c.us`);
        //   // if (labels.some(label => label.id === '32')) {
        //   //   activeCount++;
        //   //   continue;
        //   // };
          
        //   // const typeVehicle = lead.typeVehicle;
        //   // if (typeVehicle) {
        //   //   // Incrementa o contador do tipo de veículo
        //   //   typeVehicleCount[typeVehicle] = (typeVehicleCount[typeVehicle] || 0) + 1;
        //   // }

        //   // await this.sendMessageWithDelay(lead.phone, offerMessage, 5000);

        // }
        // console.log('total leads',nonDuplicatedPhones.length)
        for (let phone of nonDuplicatedPhones) {

          if(!phone){
            // console.log('pulando:', phone)
            continue
          }

          if(!phone.includes(`@`)){
            phone = `${phone}@c.us`
          }

          // Verifica labels no contato (somente para contatos individuais)
          const labels = await this.client.getChatLabels(phone);
          if (labels.some(label => label.id === '32' || label.id === '26' || label.id === '25' || label.id === '24' || label.id === '30')) {
             activeCount++; // Contador de contatos ativos
            // console.log(`Número já possui label ativa: ${phone}`);
            continue; // Ignora este número se já está ativo
          }
          
      
          // Envio de mensagem (apenas para contatos válidos)
          await this.sendMessageWithDelay(phone, offerMessage, 5000);
          // console.log(`Mensagem enviada para: ${phone}`);
        }
      
      
        this.client.sendMessage(chatId, `*BAGAÇEIRA FEITA*`)
      } else {
        let allLeads:any;
        let type = cars[0].toLocaleLowerCase()
        switch (cars[0].toLocaleLowerCase()) {
          case 'fiorino':
            this.client.sendMessage(chatId, `*Enviando mensagens para todas as Fiorinos*`)
            allLeads = await this.leadService.findAllTypeVehicle(type);
            break;
          case 'van':
            this.client.sendMessage(chatId, `*Enviando mensagens para todas as VANS*`)
            allLeads = await this.leadService.findAllTypeVehicle(type);
            break;
          case 'hr':
            this.client.sendMessage(chatId, `*Em Teste VUC*`)
            allLeads = await this.leadService.findAllTypeVehicle(type);
            break;
          case 'vuc':
            this.client.sendMessage(chatId, `*Em Teste VUC*`)
            allLeads = await this.leadService.findAllTypeVehicle(type);
            break;
          case '3/4':
            this.client.sendMessage(chatId, `*Em Teste VUC*`)
            allLeads = await this.leadService.findAllTypeVehicle(type);
            break;
          case 'toco':
            this.client.sendMessage(chatId, `*Em Teste VUC*`)
            allLeads = await this.leadService.findAllTypeVehicle(type);
            break;
          case 'truck':
            this.client.sendMessage(chatId, `*Em Teste VUC*`)
            allLeads = await this.leadService.findAllTypeVehicle(type);
            break;
          default:
            this.client.sendMessage(chatId, `Desculpa não reconheci o tipo de *veículo*`)
            break;
        };
        for (const lead of allLeads){
          const phoneRegex = /^55\d{11}$/;
          if (!phoneRegex.test(lead.phone)) {
            bugs++;
            continue;
          };

          const labels = await this.client.getChatLabels(`${lead.phone}@c.us`);
          if (labels.some(label => label.id === '32')) {
            activeCount++;
            continue;
          };
          
          const typeVehicle = lead.typeVehicle;
          if (typeVehicle) {
            // Incrementa o contador do tipo de veículo
            typeVehicleCount[typeVehicle] = (typeVehicleCount[typeVehicle] || 0) + 1;
          }

          await this.sendMessageWithDelay(lead.phone, offerMessage, 5000);

        };
      }
    }else{
      this.client.sendMessage(chatId, '*Match errado:* erro no carros ')
      return
    }
  };

  private sendMessageWithDelay(chatId, message, delay) {
    return new Promise<void>((resolve) => {
      setTimeout( async () => {

        // let imagePathFastVan =  `table/fastshop/black/van-black.jpeg`;
        // let mediaVan = MessageMedia.fromFilePath(imagePathFastVan);
        // await this.client.sendMessage(chatId, `*🚐 Ei, vanzeiro esperto! Quer lucrar mais? 😎👉*`);
        // await this.client.sendMessage(chatId, mediaVan);

        // let imagePathFastVuc =  `table/fastshop/black/vuc-black.jpeg`;
        // let mediaVuc = MessageMedia.fromFilePath(imagePathFastVuc);
        // await this.client.sendMessage(chatId, `*🚚 Ô, vuczeiro de primeira! Tá pronto pra ganhar mais? 💰🔥*`);
        // await this.client.sendMessage(chatId, mediaVuc);

        // let imagePathFastHr =  `table/fastshop/black/hr-black.jpeg`;
        // let mediaHr = MessageMedia.fromFilePath(imagePathFastHr);
        // await this.client.sendMessage(chatId, `*🚚 HRzão na área! Quer ver sua renda subir? 📈🚀*`);
        // await this.client.sendMessage(chatId, mediaHr);

        // let audioApresentationPath = `table/fastshop/cajamar-audio/apresentação.ogg`
        // let mediaApresentation = MessageMedia.fromFilePath(audioApresentationPath);
        // let audioQuestionPath = `table/fastshop/cajamar-audio/duvidas.ogg`
        // let mediaQuestion     = MessageMedia.fromFilePath(audioQuestionPath);
    
        // await this.client.sendMessage(chatId, mediaApresentation);
        // await this.client.sendMessage(chatId, mediaQuestion);

        this.client.sendMessage(chatId, message);
        // console.log('Mensagem enviada para:', chatId);
        resolve();  // Resolvemos a promise após o envio
      }, delay);
    });
  };

  private async removeAllLabels(){
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const leads = await this.client.getContacts();
    // console.log(leads.length)
    for (const lead of leads) {
      const chatId = lead.id._serialized;
      // Supondo que as etiquetas estão armazenadas em uma propriedade chamada 'labels'
      if (lead.labels && lead.labels.length > 0) {
        const labels = await this.client.getChatLabels(chatId);
        
        if (labels.some(label => label.id === '32' || label.id === '24' || label.id === '26')) {
          continue
        }

        try{
          await sleep(3000);
          await this.client.addOrRemoveLabels([], [chatId])
          await sleep(5000);
          await this.client.addOrRemoveLabels([0], [chatId])
        } catch(e){
          console.log(e)
        }
      }
    }
  };

  // Statistics

  async statistics() {
    try {
      // Obtém todas as labels
      const labels = await this.client.getLabels();
      const statisticsByRegion = await this.statisticsByRegion();
  
      const statistics = [];
  
      // Obtém todos os chats (contatos)
      const allChats = await this.client.getChats();
      const chatsWithLabels = new Set();
  
      // Itera sobre cada label
      for (const label of labels) {
        // Obtém os chats associados a essa label
        const chats = await this.client.getChatsByLabelId(label.id);
  
        // Adiciona esses chats ao conjunto de chats com labels
        chats.forEach(chat => chatsWithLabels.add(chat.id._serialized));
  
        // Adiciona a label e a quantidade de contatos associados a ela
        statistics.push({
          labelName: label.name,
          labelId: label.id,
          contactCount: chats.length, // Conta a quantidade de chats/contatos
        });
      };
  
      // Agora, filtra os chats que não possuem etiquetas
      const chatsWithoutLabels = allChats.filter(
        chat => !chatsWithLabels.has(chat.id._serialized)
      );
  
      // Adiciona a estatística de contatos sem etiquetas
      statistics.push({
        labelName: "Sem etiquetas",
        labelId: null,
        contactCount: chatsWithoutLabels.length, // Conta a quantidade de chats sem etiquetas
      });
  

      return{
        status:200,
        statistics:statistics,
        statisticsByRegion:statisticsByRegion
      }
    } catch (error) {
      console.error("Erro ao obter estatísticas das labels:", error);
    }
  };
  
  async statisticsByRegion() {
    const dddToRegion = {
      "11": "São Paulo",
      "12": "São José dos Campos",
      "13": "Santos",
      "14": "Bauru",
      "15": "Sorocaba",
      "16": "Ribeirão Preto",
      "17": "São José do Rio Preto",
      "18": "Presidente Prudente",
      "19": "Campinas",
      "21": "Rio de Janeiro",
      "22": "Campos dos Goytacazes",
      "24": "Volta Redonda",
      "27": "Vitória",
      "28": "Cachoeiro de Itapemirim",
      "31": "Belo Horizonte",
      "32": "Juiz de Fora",
      "33": "Governador Valadares",
      "34": "Uberlândia",
      "35": "Poços de Caldas",
      "37": "Divinópolis",
      "38": "Montes Claros",
      "41": "Curitiba",
      "42": "Ponta Grossa",
      "43": "Londrina",
      "44": "Maringá",
      "45": "Foz do Iguaçu",
      "46": "Francisco Beltrão",
      "47": "Joinville",
      "48": "Florianópolis",
      "49": "Chapecó",
      "51": "Porto Alegre",
      "53": "Pelotas",
      "54": "Caxias do Sul",
      "55": "Santa Maria",
      "61": "Brasília",
      "62": "Goiânia",
      "63": "Palmas",
      "64": "Rio Verde",
      "65": "Cuiabá",
      "66": "Rondonópolis",
      "67": "Campo Grande",
      "68": "Rio Branco",
      "69": "Porto Velho",
      "71": "Salvador",
      "73": "Ilhéus",
      "74": "Juazeiro",
      "75": "Feira de Santana",
      "77": "Barreiras",
      "79": "Aracaju",
      "81": "Recife",
      "82": "Maceió",
      "83": "João Pessoa",
      "84": "Natal",
      "85": "Fortaleza",
      "86": "Teresina",
      "87": "Petrolina",
      "88": "Juazeiro do Norte",
      "89": "Picos",
      "91": "Belém",
      "92": "Manaus",
      "93": "Santarém",
      "94": "Marabá",
      "95": "Boa Vista",
      "96": "Macapá",
      "97": "Coari",
      "98": "São Luís",
      "99": "Imperatriz"
    };
  
    try {
      // Obtém todos os contatos/chats
      const allChats = await this.client.getChats();
      
      const statistics = {};
  
      // Função para extrair o DDD de um número de telefone
      const getRegionFromPhone = (phoneNumber) => {
        const match = phoneNumber.match(/^55(\d{2})/); // Remove o símbolo + e usa regex para capturar o DDD
        if (match && match[1]) {
          const ddd = match[1];
          return dddToRegion[ddd] || "Região desconhecida"; // Retorna a região ou "Região desconhecida" se o DDD não estiver mapeado
        }
        return "Número inválido"; // Retorna "Número inválido" se o formato não for reconhecido
      };
  
      // Itera sobre todos os chats
      for (const chat of allChats) {
        if (chat.isGroup) continue; // Ignora grupos
  
        const region = getRegionFromPhone(chat.id.user); // Extrai a região com base no número
        if (!statistics[region]) {
          statistics[region] = 0;
        }
        statistics[region] += 1; // Incrementa o contador de contatos por região
      };
  
      // Mostra as estatísticas de contatos por região
      return statistics
    } catch (error) {
      console.error("Erro ao obter estatísticas por região:", error);
    }
  };

  // IA

  async generateOfferMessage(order: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const api_key = process.env.KEY_IA;
      const assistantId = process.env.KEY_MOX;
  
      const client = new OpenAI({ apiKey: api_key });
  
      try {
        // Criando uma nova thread
        const emptyThread = await client.beta.threads.create();
        if (!emptyThread || !emptyThread.id) {
          console.error('Erro ao criar a thread');
          return reject('Erro ao criar a thread'); // Rejeita a Promise se a thread não for criada
        }
  
        const threadId = emptyThread.id;
  
        // Criando uma mensagem na thread
        const threadMessagesText = await client.beta.threads.messages.create(
          threadId,
          { role: "user", content: order }
        );
  
        // Executando e esperando a conclusão da thread
        let run = await client.beta.threads.runs.createAndPoll(
          threadId,
          { assistant_id: assistantId }
        );
  
        if (run.status === 'completed') {
          // Listando as mensagens da thread após a execução
          const messages = await client.beta.threads.messages.list(run.thread_id);  
          // Verificando se a estrutura das mensagens está correta
          if (messages.data && messages.data[0] && messages.data[0].content) {
            //@ts-ignore
            const messageContent = messages.data[0].content[0].text?.value;
            if (messageContent) {
              return resolve(messageContent); // Resolve a Promise com o conteúdo da mensagem
            } else {
              console.error('Erro: Conteúdo da mensagem não encontrado');
              return reject('Conteúdo da mensagem não encontrado');
            }
          } else {
            console.error('Erro: Dados da mensagem não encontrados');
            return reject('Dados da mensagem não encontrados');
          }
        } else {
          console.log(`Status do run: ${run.status}`);
          return reject(`Status do run não é 'completed': ${run.status}`); // Rejeita se o status não for 'completed'
        }
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        return reject(error); // Rejeita a Promise se ocorrer erro
      }
    });
  };

  // bomb 💣
  async sendBomb(allLead:any){
    await this.client.sendMessage('5511932291233@c.us', 'Inicio de envio!\n para:', allLead.length)
    for(const lead of allLead){
      const chatId = `${lead.phone}@c.us`;
      // this.client.addOrRemoveLabels(['45'], [chatId])
      // console.log(chatId)
      const message = '🎉 *BOA NOTÍCIA CHEGANDO!* 🚚✨\n\n🔔 *PARABÉNS!* Você foi *selecionado* para uma *operação especial*! 💼🔥\nEstamos entrando em contato apenas com motoristas escolhidos a dedo\n\n\n As *vagas* são *limitadas* e queremos saber:\nComo está sua disponibilidade e seu momento atual? preparado para ganhar dinheiro? 💰\n👉 Responda está mensagem e conheça as operações \n\n📢 *Oferta especial para VUC, HR e FIORINO!*';
      await this.client.sendMessage(chatId, message);
      await new Promise(resolve => setTimeout(resolve, 4000));
    };
    await this.client.sendMessage('5511932291233@c.us', 'Bomba enviada com sucesso!')
  };
  
}
