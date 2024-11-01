import { Injectable } from '@nestjs/common';
import { Client, LocalAuth, Message, MessageMedia, } from 'whatsapp-web.js'
import * as qrcode from 'qrcode-terminal';
import { LeadService } from 'src/lead/lead.service';
import { OperationTodayService } from 'src/operation_today/operation_today.service';
import { DriverService } from 'src/driver/driver.service';
import { VehicleService } from 'src/vehicle/vehicle.service';
import FindTimeSP from 'hooks/time';
import OpenAI from "openai";
@Injectable()
export class WhatsService {
  private client: Client;
  private call  : boolean;
  private driversWorkToday:any;
  private api_key    :string
  private assistantId:string
  private IA:any
  private threadWorkListToday:any
  constructor(
    private leadService:LeadService,
    private operationTodayService:OperationTodayService,
    private driverService:DriverService,
    private vehicleService: VehicleService
  ){
    this.api_key = process.env.KEY_IA;
    this.assistantId = process.env.KEY_MAX;
    this.IA =  new OpenAI({ apiKey: this.api_key });
  }

  onModuleInit() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        executablePath: '/usr/bin/chromium',
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
      console.log('Max está pronto!');
      this.call = true
      try{
        setInterval(this.verifyHour.bind(this), 25 * 1000);
      } catch (err) {
        console.error('Erro ao enviar a mensagem:', err);
        process.exit(1)
      }
    });

    this.client.on('message', async (message: Message) => {
      this.verifyGroup(message)
      
      if(message.from == '5511932291233@c.us' && message.body == 'test'){
        try{
          await this.client.sendMessage(message.from, `Estou funcionando! v1.0`);
        } catch (err) {
          console.error('Erro ao enviar a mensagem:', err);
          process.exit(1)
        }
      };
        // this.sendMessageToGroupWithNumber(message.from,'test')
      return
    });

    this.client.initialize();
  };

  tractiveMessage(inputString, index) {
    const jsonMatch = inputString.match(/```json\s*([\s\S]*?)```/);
    const jsonMatchKeys = inputString.match(/{([^]*?)}/);
    
    if (!jsonMatch && !jsonMatchKeys) {
      return inputString;
    }

    let preserved:string;
    
    if (jsonMatch) {
      preserved = inputString.replace(jsonMatch[0], '').trim();
    } else if (jsonMatchKeys) {
      preserved = inputString.replace(jsonMatchKeys[0], '').trim();
    }

    
    if (jsonMatch || jsonMatchKeys) {
      
      const jsonString = jsonMatch ? jsonMatch[1] : jsonMatchKeys[0]; 

      this.tractiveJson(jsonString, index);
    }

    return preserved.replace(/{|}/g, '').trim();
  };

  async tractiveJson(json, index) {
    json = JSON.parse(json)
    switch (json.type) {
      case 'check-in':
        const time = FindTimeSP()
        const data = new Date(time);
        const hour   = data.getUTCHours();
        const minutes = data.getUTCMinutes();
        this.driversWorkToday[index].check = true;
        this.driversWorkToday[index].go = json.go;
        if(json.go){
          this.driversWorkToday[index].motion = 'a caminho';
        }else{
          this.driversWorkToday[index].motion = json.motion;
        }
        if (hour === 5 && minutes >= 0 && minutes <= 15) {
          this.messageWorkConfirmationList()
        }
      break
      default:
        console.log('Tipo não reconhecido:', json);
        break;
    }
  };
  
  async submitMessage(threadId, userMessage, index) {
    try {

      await this.IA.beta.threads.messages.create(
        threadId,
        { role: "user", content: userMessage }
      );

      let run = await this.IA.beta.threads.runs.createAndPoll(
        threadId,
        { 
          assistant_id: this.assistantId,
        }
      );

      if (run.status === 'completed') {
        const messages = await this.IA.beta.threads.messages.list(
          run.thread_id
        );

        //@ts-ignore
        return this.tractiveMessage(messages.data[0].content[0].text.value, index)

      } else {
        console.log(run.status);
      }
      
      // return run;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  async createThread(){
    const thread = await this.IA.beta.threads.create();
    return thread.id
  };

  async sendMessageToGroupWithNumber(phoneNumber, message) {
    try {
      // Obtém todos os grupos em comum com o número fornecido
      const allGroups = await this.client.getCommonGroups(phoneNumber);
        
      // Verifica se há grupos em comum
      if (allGroups.length === 0) {
        console.log(`O número ${phoneNumber} não está em nenhum grupo em comum.`);
        return null;  // Retorna null se não houver grupos
      }
  
      // Pega o primeiro grupo da lista
      const group = allGroups[0];
      //@ts-ignore
      const groupId = group._serialized;  // O ID completo do grupo (ex: '120363048147471668@g.us')
  
      // Envia a mensagem para o grupo
      await this.client.sendMessage(groupId, message);
      console.log(`Mensagem enviada para o grupo ${groupId}`);
  
      // Retorna o ID do grupo
      return groupId;
  
    } catch (error) {
      console.error(`Erro ao enviar mensagem para o grupo: ${error.message}`);
      return null;  // Retorna null em caso de erro
    }
  };
  
  async messageWorkConfirmation(today){
    const disponibility = await this.operationTodayService.findAllOneDate(today, 'fast-shop'); //PRODUCTION
    // const disponibility = await this.operationTodayService.findAllOneDate(`30/10/2024`, 'fast-shop'); //DEVELOPMENT
    if (Array.isArray(disponibility)) {
      const idsDrivers = [];
      const idsAuxiliaries = [];
      const contacts = [];

      disponibility.forEach(operation => {
        idsDrivers.push(operation.idDriver);         // Adiciona o idDriver ao array
        idsAuxiliaries.push(operation.idAuxiliary);  // Adiciona o idAuxiliary ao array
      });

      for (const idDriver of idsDrivers) {
        const driverDetails = await this.driverService.findOne(idDriver);
        const vehicleDetails = await this.vehicleService.findOne(idDriver,'driver')
        contacts.push({
          id: idDriver,
          plate: vehicleDetails.plate,
          name: driverDetails.name, 
          phone: `55${driverDetails.phone}`, 
        });
      };

      contacts.forEach( async (contact) => {
        const thread  = await this.createThread()
        const message = await this.submitMessage(thread, 'Ordem: envie uma mensagem de bom dia, para saber se está a caminho do serviço', null)
        const idGroup = await this.sendMessageToGroupWithNumber(contact.phone, message)
        contact.idGroup = idGroup;
        contact.check   = false;
        contact.thread  = thread;
        contact.go     = false;
        contact.motion = 'Sem contato (não respondeu)';
      });

      this.driversWorkToday = contacts
      // Retorna os arrays se necessário
      // console.log ( idsDrivers, idsAuxiliaries );

    } else {
      // Caso não seja um array, significa que houve algum erro na requisição
      console.error(`Erro ao buscar dados: ${disponibility.message} (status: ${disponibility.status})`);
      return null;
    }
  };

  async messageWorkConfirmationList(){
    if (!Array.isArray(this.driversWorkToday)) {
      console.log('não tem motorista disponível para gerar lista.')
      return
    };

    if(!this.threadWorkListToday){
      this.threadWorkListToday = await this.createThread()
    };

    let list=[];

    this.driversWorkToday.forEach( async (driver) => {
        list.push({
          plate: driver.plate,
          go   : driver.go,
          motion : driver.motion, 
        });
    })

    const jsonString = await JSON.stringify(list);
    // console.log(`Ordem: Gere uma lista de presença a parti dessas informações: ${jsonString}, Lembrando se caso você já enviou atualize o mesmo`)
    const chat = await this.submitMessage(this.threadWorkListToday, 
    `Ordem: Gere uma lista de presença a parti dessas informações: ${jsonString}, Lembrando se caso você já enviou atualize o mesmo` ,
    null)
    console.log('Max:', chat)
    this.sendMessageToGroupWithNumber(`5511969945034`, chat)// PRODUCTION
    // this.sendMessageToGroupWithNumber(`5511934858607`, chat)   // DEVELOPMENT
  };

  async verifyGroup(message){
    const serializedId = message._data.id._serialized;
    const idGroup = serializedId.split('_')[1];

    if (!Array.isArray(this.driversWorkToday)) {
      return
    };

    this.driversWorkToday.forEach(async (driver, index) => {
      if (driver.idGroup == idGroup && !driver.check) {
        const response = await this.submitMessage(driver.thread, message.body, index);
        await this.client.sendMessage(idGroup, response);
      }
    });
    
  };

  async verifyHour(){
    const time = FindTimeSP()
    const data = new Date(time);
    const hour   = data.getUTCHours();
    const minutes = data.getUTCMinutes();
    const day     = data.getUTCDate();
    const month   = data.getUTCMonth() + 1;
    const year    = data.getFullYear();
    const today = `${day}/${month}/${year}`
    
    if(hour === 4 && minutes === 1  && this.call) {
      this.call = false;
      // console.log('Deu o horario de confirma para acordar')
      this.messageWorkConfirmation(today);
      return
    }else if ( hour === 5 && minutes === 1 && !this.call){
      this.call = true;
      // console.log('Deu o horario de envio da Lista')
      this.messageWorkConfirmationList()
      return
    }else if(hour === 7 && minutes === 1 ){
      this.driversWorkToday = null
      this.threadWorkListToday = null
      return
    }
    else{
      // console.log(this.driversWorkToday)
      // console.log(this.threadWorkListToday)
    }
  };

}
