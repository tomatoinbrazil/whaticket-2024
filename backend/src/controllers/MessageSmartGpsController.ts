import { Request, Response } from "express";
import AppError from "../errors/AppError";

import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import Message from "../models/Message";
import Whatsapp from "../models/Whatsapp";
import formatBody from "../helpers/Mustache";

import FindOrCreateTicketServiceFromSmartGps from "../services/TicketServices/FindOrCreateTicketServiceFromSmartGps";
import UpdateTicketService from "../services/TicketServices/UpdateTicketService";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import CheckContactNumber from "../services/WbotServices/CheckNumber";
import GetProfilePicUrl from "../services/WbotServices/GetProfilePicUrl";
import CreateOrUpdateContactService from "../services/ContactServices/CreateOrUpdateContactService";

type IDtIntegration = {
  imei: string;
  no_not_notify_until?: string;
  text?: string;
}
type IIntegration = {
  type: string;
  data: IDtIntegration;
  externalUrl: string;
  no_not_notify_until?: string;
}
type MessageData = {
  body: string;
  fromMe: boolean;
  read: boolean;
  quotedMsg?: Message;
  number?: string;
  integration: IIntegration;
  no_not_notify_until?: string;

};

export const send = async (req: Request, res: Response): Promise<Response> => {
  // console.log('ENTROU NA ROTA POST /api/messages/send/warnings')
  // console.log({
  //   body: req.body,
  //   integration: req.body.integration.data,
  // })
  const { whatsappId } = req.params as unknown as { whatsappId: number };
  const messageData: MessageData = req.body;


  try {
    const whatsapp = await Whatsapp.findByPk(whatsappId);

    if (!whatsapp) {
      //
      throw new Error("Não foi possível realizar a operação");
    }

    if (messageData?.number === undefined) {
      throw new Error("O número é obrigatório");
    }

    if (messageData?.integration === undefined) {
      throw new Error("dados de integracao sao obrigatórios");
    }
    const numberToTest = messageData.number;
    const body = messageData.body;

    const companyId = whatsapp.companyId;

    const CheckValidNumber = await CheckContactNumber(numberToTest, companyId);
    const number = CheckValidNumber.jid.replace(/\D/g, "");
    const profilePicUrl = await GetProfilePicUrl(
      number,
      companyId
    );
    const contactData = {
      name: `${number}`,
      number,
      profilePicUrl,
      isGroup: false,
      companyId
    };

    const contact = await CreateOrUpdateContactService(contactData);

    if (!contact) {
      throw new AppError(
        "Não foi possível criar um contato"
      );
    }
    console.log('contact criado id:', contact?.id)
    console.log({number})

    const ticket = await FindOrCreateTicketServiceFromSmartGps(contact, whatsapp.id!, 0, companyId);
    if (!ticket) {
      throw new AppError(
        "Não foi possível criar um ticket"
      );
    }
    console.log('ticket criado id:', ticket?.id)

    await SendWhatsAppMessage({ body: formatBody(body, ticket), ticket });

    const stringData = JSON.stringify({
      integration: messageData.integration,
      externalUrl: messageData.integration.externalUrl,
    })

    // await UpdateTicketService({
    //   ticketId: ticket.id,
    //   ticketData: { status: "chatbot", user_api_hash: `${stringData}` },
    //   companyId
    // });

      await ticket.update({
        lastMessage: body,
      });

    SetTicketMessagesAsRead(ticket);

    await ticket.update({
      status: "chatbot",
      user_api_hash: `${stringData}`,
    });

    return res.send({ mensagem: "Mensagem enviada" });
  } catch (err: any) {
    console.log({err})
    if (Object.keys(err).length === 0) {
      throw new AppError(
        "Não foi possível enviar a mensagem, tente novamente em alguns instantes"
      );
    } else {
      throw new AppError(err.message);
    }
  }
};

