import { writeFileSync } from "fs";
import fs from "fs";
import axios from "axios";
import { join } from "path";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";
import CreateMessageService from "../MessageServices/CreateMessageService";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import { getProfile, profilePsid, sendText } from "./graphAPI";
import Whatsapp from "../../models/Whatsapp";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import { debounce } from "../../helpers/Debounce";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import formatBody from "../../helpers/Mustache";
import Queue from "../../models/Queue";
import Chatbot from "../../models/Chatbot";
import Message from "../../models/Message";
import { sayChatbot } from "../WbotServices/ChatbotListenerFacebook";
import { getIO } from "../../libs/socket";

interface IMe {
  name: string;
  // eslint-disable-next-line camelcase
  first_name: string;
  // eslint-disable-next-line camelcase
  last_name: string;
  // eslint-disable-next-line camelcase
  profile_pic: string;
  id: string;
}

export interface Root {
  object: string;
  entry: Entry[];
}

export interface Entry {
  id: string;
  time: number;
  messaging: Messaging[];
}

export interface Messaging {
  sender: Sender;
  recipient: Recipient;
  timestamp: number;
  message: MessageX;
}

export interface Sender {
  id: string;
}

export interface Recipient {
  id: string;
}

export interface MessageX {
  mid: string;
  text: string;
  reply_to: ReplyTo;
}

export interface ReplyTo {
  mid: string;
}

const verifyContact = async (msgContact: any, channel: string, companyId: any) => {
  if (!msgContact) return null;

  const contactData = {
    name: msgContact?.name || `${msgContact?.first_name} ${msgContact?.last_name}`,
    number: msgContact.id,
    profilePicUrl: msgContact.profile_pic || "",
    isGroup: false,
    companyId: companyId,
    channel: channel
  };
  ////console.log("🚀 ~ verifyContact ~ contactData:", contactData)

  const contact = CreateOrUpdateContactService(contactData);

  return contact;
};

export const verifyMessage = async (
  msg: any,
  body: any,
  ticket: Ticket,
  contact: Contact,
  session?: number
) => {
  //console.log("🚀 ~ msg:", msg)
  const quotedMsg = await verifyQuotedMessage(msg);
  const messageData = {
    id: msg.mid || msg.message_id,
    ticketId: ticket.id,
    contactId: msg.is_echo ? undefined : contact.id,
    body: msg.text || body,
    fromMe: msg.is_echo,
    read: msg?.is_echo,
    quotedMsgId: quotedMsg?.id,
    ack: 3,
    dataJson: JSON.stringify(msg)
  };

  await CreateMessageService({ messageData, companyId: ticket.companyId });

  await ticket.update({
    lastMessage: msg.text,
    whatsappId: session

  });
  //console.log("🚀 ~ session:", session)
};

export const verifyMessageMedia = async (
  msg: any,
  ticket: Ticket,
  contact: Contact
): Promise<void> => {
  const { data } = await axios.get(msg.attachments[0].payload.url, {
    responseType: "arraybuffer"
  });

  // eslint-disable-next-line no-eval
  const { fileTypeFromBuffer } = await (eval('import("file-type")') as Promise<typeof import("file-type")>);

  const type = await fileTypeFromBuffer(data);

  const fileName = `${new Date().getTime()}.${type.ext}`;

  const folder = `public/company${ticket.companyId}`;
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
    fs.chmodSync(folder, 0o777)
  }

  writeFileSync(
    join(__dirname, "..", "..", "..", folder, fileName),
    data,
    "base64"
  );

  const messageData = {
    id: msg.mid,
    ticketId: ticket.id,
    contactId: msg.is_echo ? undefined : contact.id,
    body: msg.text || fileName,
    fromMe: msg.is_echo,
    mediaType: msg.attachments[0].type,
    mediaUrl: fileName,
    read: msg.is_echo,
    quotedMsgId: null,
    ack: 3,
    dataJson: JSON.stringify(msg),

  };

  await CreateMessageService({ messageData, companyId: ticket.companyId });

  await ticket.update({
    lastMessage: msg.text
  });
};

const verifyQuotedMessage = async (msg: any): Promise<Message | null> => {
  if (!msg) return null;
  const quoted = msg?.reply_to?.mid;

  if (!quoted) return null;

  const quotedMsg = await Message.findOne({
    where: { id: quoted }
  });

  if (!quotedMsg) return null;

  return quotedMsg;
};

export const handleMessage = async (
  token: Whatsapp,
  webhookEvent: any,
  channel: string,
  companyId: any
): Promise<any> => {


  try {
    if (webhookEvent.message) {
      //console.log("🚀 ~ webhookEvent.message:", webhookEvent.message)
      let msgContact: any;

      const senderPsid = webhookEvent.sender.id;
      const recipientPsid = webhookEvent.recipient.id;
      const { message } = webhookEvent;
      const fromMe = message.is_echo;

      if (fromMe) {
        msgContact = await profilePsid(recipientPsid, token.facebookUserToken);
      } else {
        msgContact = await profilePsid(senderPsid, token.facebookUserToken);
      }



      const contact = await verifyContact(msgContact, channel, companyId);
      ////console.log("🚀 ~ contact:", contact)

      const unreadCount = fromMe ? 0 : 1;

      const getSession = await Whatsapp.findOne({
        where: {
          facebookPageUserId: token.facebookPageUserId
        },
        include: [
          {
            model: Queue,
            as: "queues",
            attributes: ["id", "name", "color", "greetingMessage"],
          }
        ],
        order: [
          ["queues", "id", "ASC"],
          ["queues", "id", "ASC"]
        ]
      });


      //console.log("🚀 ~ getSession.id:", getSession.id)

      // confirmar isso
      const _ticket = await FindOrCreateTicketService(
        contact,
        getSession.id,
        unreadCount,
        1,
        contact,
        channel
      )

      if (
        getSession.farewellMessage &&
        formatBody(getSession.farewellMessage, _ticket) === message.text
      )
        return;

      const ticket = await FindOrCreateTicketService(
        contact,
        getSession.id,
        unreadCount,
        companyId,
        contact,
        channel
      )


      if (webhookEvent.message.is_deleted) {
        const ticketUpdate = await ticket.update({
          lastMessage: "_Mensagem apagada_",
        });

        const getMessages = await Message.findOne({
          where: { id: webhookEvent.message.mid },
        });

        await Message.update({ body: "_Mensagem apagada_" }, {
          where: {
            id: webhookEvent.message.mid // Certifique-se de que este é o ID correto da mensagem que deseja atualizar
          }
        });

        const messageUpdate = await Message.findOne({
          where: {
            id: webhookEvent.message.mid
          }
        });


        const io = getIO();
        io.to(ticketUpdate.id.toString())
          .to(ticketUpdate.status)
          .to("notification")
          .emit(`company-${companyId}-appMessage`, {
            action: "update",
            message: messageUpdate,
            ticket: ticketUpdate,
            contact: ticketUpdate.contact
          });

        io.to(ticketUpdate.status)
          .to("notification")
          .to(ticketUpdate.id.toString())
          .emit(`company-${companyId}-ticket`, {
            action: "update",
            ticket: ticketUpdate,
          });

        return
      }





      if (ticket.status === "closed") {
        await ticket.update({
          status: "pending",
          whatsappId: getSession.id
        });
      }
      //console.log("🚀 ~ getSession.id:", getSession.id)

      await ticket.update({
        lastMessage: message.text,
        whatsappId: getSession.id
      });
      const t = await ticket.update({
        whatsappId: getSession.id
      });
      //console.log("🚀 ~ t:", t)

      if (message.attachments) {
        await verifyMessageMedia(message, ticket, contact);
      } else {
        await verifyMessage(message, message.text, ticket, contact, getSession.id);
      }

      if (
        !ticket.queue &&
        !fromMe &&
        !ticket.userId &&
        getSession.queues.length >= 1
      ) {
        await verifyQueue(getSession, message, ticket, contact);
      }

      if (ticket.queue && ticket.queueId) {
        if (!ticket.user) {
          await sayChatbot(
            ticket.queueId,
            getSession,
            ticket,
            contact,
            message
          );
        }
      }
    }



    return;
  } catch (error) {
    throw new Error(error);
  }
};

const verifyQueue = async (
  getSession: Whatsapp,
  msg: any,
  ticket: Ticket,
  contact: Contact
) => {
  const { queues, greetingMessage } = await ShowWhatsAppService(getSession.id!, ticket.companyId);

  if (queues.length === 1) {
    await UpdateTicketService({
      ticketData: { queueId: queues[0].id },
      ticketId: ticket.id,
      companyId: ticket.companyId,
    });

    return;
  }

  const selectedOption = msg.text;

  const choosenQueue = queues[+selectedOption - 1];

  if (choosenQueue) {
    await UpdateTicketService({
      ticketData: { queueId: choosenQueue.id },
      ticketId: ticket.id,
      companyId: ticket.companyId,
    });

    if (choosenQueue.options.length > 0) {
      let options = "";
      choosenQueue.options.forEach((chatbot, index) => {
        options += `*${index + 1}* - ${chatbot.title}\n`;
      });

      const body = formatBody(
        `\u200e${choosenQueue.greetingMessage}\n\n${options}\n*#* Volver al menú principal`,
        ticket
      );

      sendText(
        contact.number,
        formatBody(body, ticket),
        ticket.whatsapp.facebookUserToken
      );

      return await verifyMessage(msg, body, ticket, contact);
    }

    if (!choosenQueue.options.length) {
      const body = formatBody(`\u200e${choosenQueue.greetingMessage}`, ticket);

      //console.log("🚀 ~ body 1:", body)
      sendText(
        contact.number,
        formatBody(body, ticket),
        ticket.whatsapp.facebookUserToken
      );

      return; // await verifyMessage(msg, body, ticket, contact);
    }
  } else {
    let options = "";

    queues.forEach((queue, index) => {
      options += `*${index + 1}* - ${queue.name}\n`;
    });

    const body = formatBody(`\u200e${greetingMessage}\n\n${options}`, ticket);

    //console.log("🚀 ~ body:", body)
    const debouncedSentMessage = debounce(
      async () => {
        sendText(
          contact.number,
          formatBody(body, ticket),
          ticket.whatsapp.facebookUserToken
        );

        return verifyMessage(msg, body, ticket, contact);
      },
      3000,
      ticket.id
    );

    debouncedSentMessage();
  }
};
