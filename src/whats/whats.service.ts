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
        headless: true,         //true means browser wont be dispalyed, false means chromium opens with web whatsapp
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
      },
      webVersionCache: {
      type: 'remote',
      remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2410.1.html',
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

  availability(number:string, status:string, date:string){
    const newNumber  = `${number}@c.us`; // número do destinatário
    let   message;
    switch (status) {
      case 'hasCharge':
      message = `*Olá, aqui é a Mix (assistente virtual da Mix 👋🏽👩🏽)*\n\n*Passando pra te avisar que você está confirmado para carregar amanhã 📦*\n*📆 ${date}*\n*🕓 5:00am*\n*📍  CD - Fast Shop Rod Anhanguera Km 37,5. CEP: 07789-100. Bairro: Jordanesia*\n\n\n*❗Atenção: Quando chegar no CD entre no app e confirme que você chegou no local*`;
      break;
      case 'noCharge':
        message = message = `*Olá, aqui é a Mix (assistente virtual da Mix 👋🏽👩🏽)*\n\n*Passando pra te avisar que você infelizmente não foi selecionado 🥺*\n\n*❌Sem carga para amanhã* \n\n\n*📌 Mas não desanime pois a partir das 8:00am até as 14:00pm você pode marcar novamente a disponibiliade pelo app*`;
        break;
    
      default:
        return
    }
    
    this.client.sendMessage(newNumber, message).then(response => {
      return{
        status : 200,
        message:'Message sent successfully'
      }
    }).catch(err => {
      console.error('Failed to send message', err);
      return{
        status:500,
        message: 'Server error internal'
      }
    });
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
