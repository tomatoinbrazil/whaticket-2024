import axios from "axios";
import Ticket from "../../models/Ticket";
import QueueIntegrations from "../../models/QueueIntegrations";
import {
  proto,
  WASocket,
} from "@whiskeysockets/baileys";
import { getBodyMessage } from "../WbotServices/wbotMessageListener";
import { logger } from "../../utils/logger";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import FlowBuilder from "../../models/FlowBuilder";
// import AWS from 'aws-sdk'


type Session = WASocket & {
    id?: number;
};

interface Request {
    wbot: Session;
    msg: proto.IWebMessageInfo;
    ticket: Ticket;
    queueIntegration?: QueueIntegrations;
    flowId?: number;
}

interface IMe {
  name: string,
  id: string,
}

const flowListener = async ({
  wbot,
  msg,
  ticket,
  queueIntegration,
  flowId,
}: Request): Promise<void> => {

  if (msg.key.remoteJid === 'status@broadcast') return;

  const bodyMessage = getBodyMessage(msg);
  const sendMessage = async (text: string) => {
      await wbot.sendMessage(msg.key.remoteJid, { text });
  }

  // const config = new AWS.Config({
  //   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  //   region: process.env.AWS_REGION,
  // });

  // const s3 = new AWS.S3(config);

  // const signedUrlExpireSeconds = 400;

  // function getImageAws(key: string) {
  //   return s3.getSignedUrl('getObject', {
  //     Bucket: `${process.env.S3_BUCKET_NAME}/uploads-flows`,
  //     Key: key,
  //     Expires: signedUrlExpireSeconds,
  //   });
  // }

  const sendImagemLink = async (url: string) => {
    const media = {
      image: {
          url,
        },
    };
    await wbot.sendMessage(msg.key.remoteJid, media);
  };

  const transferQueue = async (dataQueue: any): Promise<void> => {
    const parseString = JSON.parse(dataQueue);
    await UpdateTicketService({
      ticketData: { queueId: Number(parseString.id), user_api_hash: 'transferQueue', useIntegration: false },
      ticketId: ticket.id,
      companyId: ticket.companyId
    });
  };

  try {
    const { nodes: node } = await FlowBuilder.findByPk(flowId || queueIntegration.flowBuilderId);

    if (!ticket?.user_api_hash || ticket?.user_api_hash === 'transferQueue') {
      const nodeCurrent = node.find(node => !node.nodeId);
      if (nodeCurrent) {
        for (const item of nodeCurrent.data) {
          switch (item.type) {
            case 'text':
              await sendMessage(item.data.text);
              await new Promise(resolve => setTimeout(resolve, 2000));
              break;
            case 'transferQueue':
              await new Promise(resolve => setTimeout(resolve, 2000));
              await transferQueue(item.data.text);
              break;
            case 'interval':
              await new Promise(resolve => setTimeout(resolve, Number(item.data.text)));
              break;
            case 'image':
              await sendImagemLink(item.data.text);
              await new Promise(resolve => setTimeout(resolve, 3000)); // Espera 4 segundos
              break;
            case 'exit':
              await UpdateTicketService({
                ticketData: { status: "closed", user_api_hash: null },
                ticketId: ticket.id,
                companyId: ticket.companyId,
              });
              await ticket.reload();
              await sendMessage('Atendimento encerrado.');
              break;
            case 'conditional':
              const optionsText = item.data.options.map(option => `${option.number} - ${option.text}`).join('\n');
              await UpdateTicketService({
                ticketData: { user_api_hash: nodeCurrent.id },
                ticketId: ticket.id,
                companyId: ticket.companyId,
              });
              await ticket.reload();
              await sendMessage(`${item.data.title}\n${optionsText}`);
              await new Promise(resolve => setTimeout(resolve, 2000));
              break;
            default:
              console.log("Tipo de dado desconhecido");
          }
        }
        return;
      }
      return;
    }

    const nodeIdCurrent = ticket?.user_api_hash;

    const nodeCurrentWithId = node.find(node => node.id == nodeIdCurrent);
    let optionId: string;

    for (const item of nodeCurrentWithId.data) {
      if (item.data?.options) {
        item.data.options.forEach(option => {
          if (option.number === bodyMessage) {
            optionId = option.id;
          }
        });
      }
    }

    if (optionId) {
      const nodeCurrent = node.find(node => optionId === node.optionId);
      if (nodeCurrent) {
        for (const item of nodeCurrent.data) {
          switch (item.type) {
            case 'text':
              await sendMessage(item.data.text);
              await new Promise(resolve => setTimeout(resolve, 2000));
              break;
            case 'transferQueue':
              await new Promise(resolve => setTimeout(resolve, 2000));
              await transferQueue(item.data.text);
              break;
            case 'interval':
              await new Promise(resolve => setTimeout(resolve, Number(item.data.text)));
              break;
            case 'image':
              await sendImagemLink(item.data.text);
              await new Promise(resolve => setTimeout(resolve, 4000)); // Espera 4 segundos
              break;
            case 'exit':
              await UpdateTicketService({
                ticketData: { status: "closed", user_api_hash: null },
                ticketId: ticket.id,
                companyId: ticket.companyId,
              });
              await ticket.reload();
              await sendMessage('Atendimento encerrado!');
              break;
            case 'conditional':
              const optionsText = item.data.options.map(option => `${option.number} - ${option.text}`).join('\n');
              await UpdateTicketService({
                ticketData: { user_api_hash: nodeCurrent.id },
                ticketId: ticket.id,
                companyId: ticket.companyId,
              });
              await ticket.reload();
              await sendMessage(`${item.data.title}\n${optionsText}`);
              await new Promise(resolve => setTimeout(resolve, 2000));
              break;
            default:
              console.log("Tipo de dado desconhecido");
          }
        }
      }
    }
  } catch (error) {
      logger.info("Error on flowListener: ", error);
      throw error;
  }
};

export default flowListener;
