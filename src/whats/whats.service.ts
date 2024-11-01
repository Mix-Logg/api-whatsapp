import { Injectable } from '@nestjs/common';
import { Client, LocalAuth, Message, MessageMedia, } from 'whatsapp-web.js'
import * as qrcode from 'qrcode-terminal';
import { LeadService } from 'src/lead/lead.service';
import FindTimeSP from 'hooks/time';
import OpenAI from "openai";
import * as fs from 'fs';
import * as path from 'path';
@Injectable()
export class WhatsService {
  private client: Client;
  constructor(
    private leadService:LeadService
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

    this.client.on('ready', () => {
      console.log('Cliente está pronto!');
    });

    this.client.on('message', async (message: Message) => {
      let lead:any
      const hasRegister = await this.leadService.findOnePhone(message.id.remote);
      const haveLabel   = await this.client.getChatLabels(message.from);
      if(hasRegister.status == 500){
        const newLead = await this.leadService.create({phone:message.id.remote})
        if(newLead.status == 201){
          lead = newLead.result;
        }else{
          console.log('não foi possível salvar')
        }
      }else{
        lead = hasRegister.result
      };
      if(haveLabel.length > 0){
        switch (haveLabel[0].id) {
          case '18':
            // this.handleIncomingMessageTwo(message)
            // first contact
            break;
          case '24':
            const response = await this.submitMessage(lead.thread, `ordem:(Diga que ele está na fila de espera) ${message.body}`, lead.id, null, message.from )
            await this.client.sendMessage(message.from , response);
            // suport
            return
          case '25':
            // doc
            break
          case '26':
            // human
            return
          default:
            return
        }
      };
        const chatId = message.from
        let response:any;
        switch (message.type) {
          case 'ptt':
            console.log('audio')
            message.body = `ordem:(Você acabou de receber uma audio, atualmente você não tem suporte de ouvir audio, pergunte se quer conversa com um atendente humano)`
            response = await this.submitMessage(lead.thread, message.body, lead.id, null, chatId )
            break;
          case 'image':
            // console.log(message._data)
            message.body = `ordem:(Você acabou de receber uma imagem, atualmente você não tem suporte de visualização pergunte se é algum doc (caso você chegou nessa etapa) e faça uma lista dos documentos faltantes ou pergunte sobre o que se trata) usuario:${message.body}`
            response = await this.submitMessage(lead.thread, message.body, lead.id, null, chatId )
            await this.client.sendMessage(chatId , response);
            break
          case 'document':
            message.body = `ordem:(Você acabou de receber um pdf, atualmente você não tem suporte de visualização pergunte se é algum doc (caso você chegou nessa etapa) e faça uma lista dos documentos faltantes ou pergunte sobre o que se trata) usuario:${message.body}`
            response = await this.submitMessage(lead.thread, message.body, lead.id, null, chatId )
            await this.client.sendMessage(chatId , response);
          default:
            response = await this.submitMessage(lead.thread, message.body, lead.id, null, chatId )
            await this.client.sendMessage(chatId , response);
            break;
        };
        return
    });

    this.client.initialize();
  };


  tractiveMessage(inputString, idLead, chatId) {
    // Usar uma expressão regular para capturar o JSON em um bloco
    const jsonMatch = inputString.match(/```json\s*([\s\S]*?)```/);
    const jsonMatchKeys = inputString.match(/{([^]*?)}/);

    // Se não encontrar JSON, retorna a string original
    if (!jsonMatch && !jsonMatchKeys) {
      return inputString;
    }

    let preserved:string;

    // Verifica qual JSON foi encontrado e preserva a string correspondente
    if (jsonMatch) {
      preserved = inputString.replace(jsonMatch[0], '').trim();
    } else if (jsonMatchKeys) {
      preserved = inputString.replace(jsonMatchKeys[0], '').trim();
    }

    // Chama a função para processar o JSON, se necessário
    if (jsonMatch || jsonMatchKeys) {
      // Extraímos o JSON da string
      const jsonString = jsonMatch ? jsonMatch[1] : jsonMatchKeys[0]; 
      this.tractiveJson(jsonString, idLead, chatId); // Chama a função de processamento de JSON
    }

    // Retorna a string preservada sem o JSON
    return preserved.replace(/{|}/g, '').trim();
  };

  async tractiveJson(json, idLead, chatId) {
    // Limpeza da string JSON para remover quebras de linha e espaços em branco
    let parsedJson
    try {
      parsedJson = JSON.parse(json);
    } catch (error) {
      console.error('Erro ao analisar JSON:', error);
      return; // Retorna em caso de erro para evitar continuar com JSON inválido
    }
    let imagePath;
    let media;
    switch (parsedJson.type) {
      case 'confirm':
          this.leadService.update(idLead, parsedJson.clientJson);
          this.client.addOrRemoveLabels([''], [chatId])
          this.client.addOrRemoveLabels(['18'], [chatId])
          // etiqueta first contact
          break;
      case 'wait':
            this.client.addOrRemoveLabels([''], [chatId])
            this.client.addOrRemoveLabels(['24'], [chatId])
            // etiqueta wait
            break;   
      case 'doc':
            this.client.addOrRemoveLabels([''], [chatId])
            this.client.addOrRemoveLabels(['25'], [chatId])
            // etiqueta document
            break;
      case 'tableBarueri':
        switch (parsedJson.clientJson.vehicle.toLowerCase()) {
          case 'vuc':
            imagePath = `table/americanas/vuc.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            await this.client.sendMessage(chatId, media);
          case '3/4':
            imagePath = `table/americanas/34.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            await this.client.sendMessage(chatId, media);
            break;
          case 'toco':
            imagePath = `table/americanas/toco.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            await this.client.sendMessage(chatId, media);
            break;
          case 'truck':
            imagePath = `table/americanas/truck.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            await this.client.sendMessage(chatId, media);
            break;
          default:
            console.log(parsedJson.clientJson.vehicle.toLowerCase())
            break;
        }
        break
      case 'tableContagem':
        switch (parsedJson.clientJson.vehicle.toLowerCase()) {
          case 'hr':
            imagePath = `table/fastshop/uberlandia-contagem-vuc-hr.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            await this.client.sendMessage(chatId, media);
          case 'vuc':
            imagePath = `table/fastshop/uberlandia-contagem-vuc-hr.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            await this.client.sendMessage(chatId, media);
            break;
          default:
            console.log(parsedJson.clientJson.vehicle.toLowerCase())
            break;
        }
        break
      case 'tableUberlandia':
        switch (parsedJson.clientJson.vehicle.toLowerCase()) {
          case 'hr':
            imagePath = `table/fastshop/uberlandia-contagem-vuc-hr.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            await this.client.sendMessage(chatId, media);
          case 'vuc':
            imagePath = `table/fastshop/uberlandia-contagem-vuc-hr.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            await this.client.sendMessage(chatId, media);
            break;
          default:
            console.log(parsedJson.clientJson.vehicle.toLowerCase())
            break;
        }
        break
      case 'tableCajamar':
        switch (parsedJson.clientJson.vehicle.toLowerCase()) {
          case 'fiorino':
            imagePath =  `table/fastshop/cajamar-fiorino.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            await this.client.sendMessage(chatId, media);
            break;
          case 'hr':
            imagePath =  `table/fastshop/cajamar-hr.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            await this.client.sendMessage(chatId, media);
          case 'vuc':
            imagePath =  `table/fastshop/cajamar-vuc.jpeg`;
            media = MessageMedia.fromFilePath(imagePath);
            await this.client.sendMessage(chatId, media);
            break;
          default:
            console.log(parsedJson.clientJson.vehicle.toLowerCase())
            break;
        }
        break
      default:
          console.log('Tipo não reconhecido:', typeof(parsedJson));
          console.log()
          break;
    }
  };
  
  async submitMessage(threadId, userMessage, leadId, Image, chatId) {
    const api_key = process.env.KEY_IA
    const assistantId = process.env.KEY_MIX

    const client = new OpenAI({ apiKey: api_key }); // Substitua por sua chave da API
    
    try {
      if(!threadId){
        const emptyThread = await client.beta.threads.create();
        this.leadService.update(leadId, {thread:emptyThread.id})
        threadId = emptyThread.id
      };

      if(Image){
        const threadMessagesImage = await client.beta.threads.messages.create(
          threadId,
          {
            "role": "user",
            "content": [
              {"type": "text", "text": userMessage},
              {
                "type": "image_url",
                "image_url": {
                  "url": Image,
                  "detail": "high"
                },
              },
            ],
          }
        )
      }else{
        const threadMessagesText = await client.beta.threads.messages.create(
          threadId,
          { role: "user", content: userMessage }
        );
      };

      let run = await client.beta.threads.runs.createAndPoll(
        threadId,
        { 
          assistant_id: assistantId,
        }
      );

      if (run.status === 'completed') {
        const messages = await client.beta.threads.messages.list(
          run.thread_id
        );

        //@ts-ignore
        const response = this.tractiveMessage(messages.data[0].content[0].text.value, leadId, chatId)
        return response

        // for (const message of messages.data.reverse()) {
        //   //@ts-ignore
        //   console.log(`${message.role} > ${message.content[0].text.value}`);
        // }
      } else {
        console.log(run.status);
      }
      
      // return run;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  async savePicture(base64String) {
    // Extrair o tipo MIME e a parte Base64
    const matches = base64String.match(/^data:(.+);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
        throw new Error('String Base64 inválida');
    }

    const mimeType = matches[1]; // Tipo MIME
    const base64Data = matches[2]; // Parte Base64

    // Converter a string Base64 em um Buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Definindo o caminho de saída com base no tipo MIME
    let extension;
    switch (mimeType) {
        case 'image/jpeg':
            extension = 'jpg';
            break;
        case 'image/png':
            extension = 'png';
            break;
        case 'image/gif':
            extension = 'gif';
            break;
        case 'image/webp':
            extension = 'webp';
            break;
        default:
            throw new Error('Tipo MIME não suportado: ' + mimeType);
    }

    const outputPath = path.join(__dirname, 'imagens', `output_image.${extension}`);

    // Cria a pasta 'imagens' se não existir
    const imagesDir = path.join(__dirname, 'imagens');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir);
    }

    fs.writeFileSync(outputPath, imageBuffer);
    console.log(`Imagem salva em: ${outputPath}`);
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
  
  // ################ STATISTICS ###################### \\
  
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

}
