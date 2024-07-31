import { Injectable } from '@nestjs/common';
import { CreateWhatDto } from './dto/create-what.dto';
import { UpdateWhatDto } from './dto/update-what.dto';
import { Client, LocalAuth} from 'whatsapp-web.js'
import * as qrcode from 'qrcode-terminal';
@Injectable()
export class WhatsService {

  private client: Client;
  onModuleInit() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        executablePath: '/usr/bin/chromium-browser',
        headless: true,  
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--unhandled-rejections=strict',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
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

    this.client.initialize();
  }

  create(createWhatDto: CreateWhatDto) {
    return 'This action adds a new what';
  }

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
  }

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
      return {
        status: 500,
        message: 'Server internal error'
      };
    }
  }
  
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
      return {
        status: 500,
        message: 'Server internal error'
      };
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} what`;
  }

  update(id: number, updateWhatDto: UpdateWhatDto) {
    return `This action updates a #${id} what`;
  }

  remove(id: number) {
    return `This action removes a #${id} what`;
  }
}
