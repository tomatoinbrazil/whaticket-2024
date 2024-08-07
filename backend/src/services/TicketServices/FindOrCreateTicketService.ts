import { subHours } from "date-fns";
import { Op } from "sequelize";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import ShowTicketService from "./ShowTicketService";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import Setting from "../../models/Setting";
import Whatsapp from "../../models/Whatsapp";
import Company from "../../models/Company";
import Plan from "../../models/Plan";
import { tr } from "date-fns/locale";
import axios from 'axios';

interface TicketData {
  status?: string;
  companyId?: number;
  unreadMessages?: number;
}

const FindOrCreateTicketService = async (
  contact: Contact,
  whatsappId: number,
  unreadMessages: number,
  companyId: number,
  groupContact?: Contact,
  channel?: string,
): Promise<Ticket> => {

  let ticket = await Ticket.findOne({
    where: {
      status: {
        [Op.or]: ["open", "pending", "closed", "chatbot", "chatbot2"]
      },
      contactId: groupContact ? groupContact.id : contact.id,
      companyId,
      whatsappId
    },
    order: [["id", "DESC"]]
  });

  if (ticket) {
    await ticket.update({ unreadMessages, whatsappId });
  }

  if (ticket?.status === "closed") {
    await ticket.update({ queueId: null, userId: null });
  }

  if (!ticket && groupContact) {
    ticket = await Ticket.findOne({
      where: {
        contactId: groupContact.id
      },
      order: [["updatedAt", "DESC"]]
    });

    if (ticket) {
      await ticket.update({
        status: "pending",
        userId: null,
        unreadMessages,
        queueId: null,
        companyId
      });
      await FindOrCreateATicketTrakingService({
        ticketId: ticket.id,
        companyId,
        whatsappId: ticket.whatsappId,
        userId: ticket.userId
      });
    }
    const msgIsGroupBlock = await Setting.findOne({
      where: { key: "timeCreateNewTicket" }
    });

    const value = msgIsGroupBlock ? parseInt(msgIsGroupBlock.value, 10) : 7200;
  }

  if (!ticket && !groupContact) {
    ticket = await Ticket.findOne({
      where: {
        updatedAt: {
          [Op.between]: [+subHours(new Date(), 2), +new Date()]
        },
        contactId: contact.id
      },
      order: [["updatedAt", "DESC"]]
    });

    if (ticket) {
      await ticket.update({
        status: "pending",
        userId: null,
        unreadMessages,
        queueId: null,
        companyId
      });
      await FindOrCreateATicketTrakingService({
        ticketId: ticket.id,
        companyId,
        whatsappId: ticket.whatsappId,
        userId: ticket.userId
      });
    }
  }

  const whatsapp = await Whatsapp.findOne({
    where: { id: whatsappId }
  });

  if (!ticket) {
    let quotationCode;

    const company = await Company.findOne({
      where: { id: companyId }
    });

    const plan = await Plan.findOne({
      where: { id: company.planId }
    });

    const whatsapp = await Whatsapp.findOne({
      where: { id: whatsappId }
    });

    if (plan?.usePowerCrm === true && whatsapp.enablePowerCrm === true) {
      const powerCrmToken = await Setting.findOne({
        where: {
          companyId,
          key: "powercrm"
        }
      });

      const options = {
        method: 'POST',
        url: 'https://api.powercrm.com.br/api/quotation/add',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${powerCrmToken.value}`
        },
        data: { name: contact.name, phone: contact.number }
      };

      try {
        const response = await axios.request(options);
        quotationCode = await response.data.quotationCode;
      } catch (error) {
        console.error(error);
      }
    }

    ticket = await Ticket.create({
      contactId: groupContact ? groupContact.id : contact.id,
      status: "pending",
      isGroup: !!groupContact,
      unreadMessages,
      whatsappId,
      whatsapp,
      companyId,
      quotationCode: quotationCode,
      channel,
      quatationSet: false
    });
    await FindOrCreateATicketTrakingService({
      ticketId: ticket.id,
      companyId,
      whatsappId,
      userId: ticket.userId
    });
  }

  ticket = await ShowTicketService(ticket.id, companyId);

  return ticket;
};

export default FindOrCreateTicketService;
