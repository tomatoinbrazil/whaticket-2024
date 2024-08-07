import { FindOptions } from "sequelize/types";
import moment from "moment";
import * as Sentry from "@sentry/node";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import GetWhatsappWbot from "../../helpers/GetWhatsappWbot";
import Integration from "../../models/Integration";
import Company from "../../models/Company";
import { MessageData, SendMessage } from "../../helpers/SendMessage";
import formatBody from "../../helpers/Mustache";

import { getWbot } from "../../libs/wbot";
import { log } from "console";
import { format, parse, startOfDay, subDays } from "date-fns";
import Contact from "../../models/Contact";
import FindOrCreateTicketService from "../../services/TicketServices/FindOrCreateTicketService";


const fs = require('fs')
const CronJob = require("cron").CronJob;
const axios = require("axios").default;

function parseToMilliseconds(seconds) {
  return seconds * 1000;
}

async function sleep(seconds) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, parseToMilliseconds(seconds));
  });
}

function randomValue(min, max) {
  return Math.floor(Math.random() * max) + min;
}


export async function handleOverdueEVO() {
  const companies = await Company.findAll();
  companies.map(async (c) => {
    const companyId = c.id;
    const options1: FindOptions = {
      where: {
        companyId,
        name: "evo",
      },
    };
    function formatISODate(isoDate: string): string {
      const date = new Date(isoDate);

      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Os meses são indexados de 0 a 11
      const year = date.getFullYear().toString();

      return `${day}/${month}/${year}`;
    }

    function currencyFormat(value) {
      const formattedValue = value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      return formattedValue;
    }

    function makeid(length) {
      var result = '';
      var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      var charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    }

    function formatBRNumber(jid: string) {
      const regexp = new RegExp(/^(\d{2})(\d{2})\d{1}(\d{8})$/);
      if (regexp.test(jid)) {
        const match = regexp.exec(jid);
        if (match && match[1] === '55' && Number.isInteger(Number.parseInt(match[2]))) {
          const ddd = Number.parseInt(match[2]);
          if (ddd < 31) {
            return match[0];
          } else if (ddd >= 31) {
            return match[1] + match[2] + match[3];
          }
        }
      } else {
        return jid;
      }
    }

    function createJid(number: string) {
      if (number.includes('@g.us') || number.includes('@s.whatsapp.net')) {
        return formatBRNumber(number) as string;
      }
      return number.includes('-')
        ? `${number}@g.us`
        : `${formatBRNumber(number)}@s.whatsapp.net`;
    }

    async function sendMessageLink(msg: string, whatsappId: any, url: any, number: string) {
      const wbot = await getWbot(whatsappId);
      const id = createJid(number);
      const numberContatct = id.split('@')[0];
      try {
        await wbot.sendMessage(
          id, {
          document: url ? { url } : fs.readFileSync(`public/temp/Boleto-${makeid(10)}`),
          fileName: "Boleto.pdf",
          caption: msg,
          mimetype: 'application/pdf'
        });
        const contactVerify = await Contact.findOne({
          where: { companyId, number: numberContatct },
        });
        const ticket = await FindOrCreateTicketService(contactVerify, whatsappId, 0, companyId);
        await ticket.update({ status: "closed" });
        return true
      } catch (error) {
        logger.error(error)
        return false
      }

    };

    async function sendMessage(msg: string, whatsappId: any, number: string) {
      const wbot = await getWbot(whatsappId);
      const id = createJid(number);
      const numberContatct = id.split('@')[0];
      try {
        await wbot.sendMessage(
          id, { text: msg, });
        const contactVerify = await Contact.findOne({
          where: { companyId, number: numberContatct },
        });
        const ticket = await FindOrCreateTicketService(contactVerify, whatsappId, 0, companyId);
        ticket.update({ status: "closed" });
        return true
      } catch (error) {
        logger.error(error)
        return false
      }

    };

    //////////////////////////////////////////////////////////////////////////////////////////////////
    //                             VERIFICA A HORA PARA ENVIAR AS MENSAGENS                         //
    //////////////////////////////////////////////////////////////////////////////////////////////////
    const job = new CronJob("0 * * * * *", async () => {
      logger.info("Iniciando verificação envios - EVO");

      const integration = await Integration.findAll(options1);

      let tokenEvo = integration[0]?.token;
      let tokenName = integration[0]?.nameToken;
      let envioAnt = integration[0]?.envioAnt;
      let envioAposVenc = integration[0]?.envioAposVenc;
      let maxAposVenc = integration[0]?.maxAposVenc;
      let incAposVenc = integration[0]?.incAposVenc;
      let envDiaVenc = integration[0]?.envDiaVenc;
      let msgAntVenc = integration[0]?.msgAntVenc;
      let msgVenc = integration[0]?.msgVenc;
      let msgAposVenc = integration[0]?.msgAposVenc;
      let hora = integration[0]?.hora;
      let whatsappId = integration[0]?.whatsappId;
      const whatsapp = await Whatsapp.findByPk(whatsappId);
      const evob64 = btoa(`${tokenName}:${tokenEvo}`);
      const hours = moment().format("HH:mm");
      //console.log("🚀 ~ job ~ evob64:", evob64)
      const urlBackend = process.env.BACKEND_URL;

      const dateHoje = new Date();
      const dateVenc = moment(dateHoje.setDate(dateHoje.getDate() - incAposVenc)).format("YYYY-MM-DD");

      async function getMember(id) {
        var options = {
          method: 'GET',
          url: `https://evo-integracao-api.w12app.com.br/api/v1/members/${id}`,
          headers: {
            Authorization: `Basic ${evob64}`
          }
        };

        try {
          const response = await axios.request(options);
          return response.data;
        } catch (error) {
          console.error(error);
        }
      }

      async function getSales(salesId) {
        var options = {
          method: 'GET',
          url: `https://evo-integracao-api.w12app.com.br/api/v1/sales/${salesId}`,
          headers: {
            Authorization: `Basic ${evob64}`
          }
        };

        try {
          const response = await axios.request(options);
          return response.data;
        } catch (error) {
          console.error(error);
        }
      }


      if (hours === hora) {
        logger.info("Horario pragramado para envio encontrado");
        //////////////////////////////////////////////////////////////////////////////////////////////////
        //                   ENVIANDO NOTIFICAÇÃO PARA CLIENTES COM FATURAS EM ABERTO                   //
        //////////////////////////////////////////////////////////////////////////////////////////////////

        async function faturasAbertas() {

        }

        //////////////////////////////////////////////////////////////////////////////////////////////////
        //              ENVIANDO NOTIFICAÇÃO PARA CLIENTES COM VENCIMENTO NA DATA DE HOJE               //
        //////////////////////////////////////////////////////////////////////////////////////////////////

        async function faturasHoje() {

        }

        //////////////////////////////////////////////////////////////////////////////////////////////////
        //                    ENVIANDO NOTIFICAÇÃO PARA CLIENTES COM FATURAS VENCIDAS                   //
        //////////////////////////////////////////////////////////////////////////////////////////////////
        async function faturasVencidas() {
          /*           var options = {
                      method: 'GET',
                      url: 'https://evo-integracao-api.w12app.com.br/api/v1/receivables',
                      params: {
                        dueDateStart: dateVenc,
                        dueDateEnd: dateVenc,
                        accountStatus: '4',
                        take: '50',
                        skip: '0'
                      },
                      headers: {
                        Authorization: `Basic ${evob64}`
                      }
                    };
          
                    await axios.request(options).then(async function (response) {
                      for (let i = 0; i < response.data.length; i++) {
                        if (response.data[i].idMemberPayer) {
                          let member = await getMember(response.data[i].idMemberPayer)
                          let sales = await getSales(response.data[i].idSale)
                          const memberName = member.firstName;
                          const contact = member.contacts[0].description.replace(/[^a-zA-Z0-9]/g, '');
                          const branchName = member.branchName;
                          const salesDescription = sales.saleItens[0].description;
                          const itemValue = currencyFormat(sales.saleItens[0].itemValue);
                          const dueDate = formatISODate(response.data[i].dueDate);
                          const descriptionInvoice = response.data[i].description;
          
                          const whatsapp = await Whatsapp.findByPk(whatsappId);
          
                          var msg = msgAposVenc.replace(/%name%/g, memberName);
                          var msg = msg.replace(/%branchName%/g, branchName);
                          var msg = msg.replace(/%venc%/g, dueDate);
                          var msg = msg.replace(/%valor%/g, itemValue);
                          var msg = msg.replace(/%motivo%/g, descriptionInvoice);
                          console.log("//////////////////////////////////////////////////////////////////////////////////////////////////")
                          console.log("🚀 ~ msg:", msg)
                          console.log("//////////////////////////////////////////////////////////////////////////////////////////////////")
          
                          //const sendMessageText = await sendMessage(msg, whatsappId, `55${contact}`)
                          await sleep(randomValue(5, 10))
                          msg = "";
                          msg = "";
                        }
                      }
          
          
                    }).catch(function (error) {
                      console.error(error);
                    }); */

          const dueDate = startOfDay(parse(dateVenc, 'yyyy-MM-dd', new Date()));

          const possibleSendDates = [];
          possibleSendDates.push(dueDate);
          for (let i = 1; i * envioAposVenc <= maxAposVenc; i++) {
            possibleSendDates.push(subDays(dueDate, i * envioAposVenc));
          }

          async function processDates() {
            for (const date of possibleSendDates) {
              const element = format(date, 'yyyy-MM-dd');

              var options = {
                method: 'GET',
                url: 'https://evo-integracao-api.w12app.com.br/api/v1/receivables',
                params: {
                  dueDateStart: element,
                  dueDateEnd: element,
                  accountStatus: '4',
                  take: '50',
                  skip: '0'
                },
                headers: {
                  Authorization: `Basic ${evob64}`
                }
              };

              try {
                const response = await axios.request(options);

                for (let i = 0; i < response.data.length; i++) {
                  if (response.data[i].idMemberPayer) {
                    let member = await getMember(response.data[i].idMemberPayer);
                    let sales = await getSales(response.data[i].idSale);
                    const memberName = member.firstName;
                    const contact = member.contacts[0].description.replace(/[^a-zA-Z0-9]/g, '');
                    const branchName = member.branchName;
                    const salesDescription = sales.saleItens[0].description;
                    const itemValue = currencyFormat(sales.saleItens[0].itemValue);
                    const dueDate = formatISODate(response.data[i].dueDate);
                    const descriptionInvoice = response.data[i].description;

                    const whatsapp = await Whatsapp.findByPk(whatsappId);

                    var msg = msgAposVenc.replace(/%name%/g, memberName);
                    msg = msg.replace(/%branchName%/g, branchName);
                    msg = msg.replace(/%venc%/g, dueDate);
                    msg = msg.replace(/%valor%/g, itemValue);
                    msg = msg.replace(/%motivo%/g, descriptionInvoice);

                    console.log("//////////////////////////////////////////////////////////////////////////////////////////////////");
                    console.log("🚀 ~ processDates ~ contact:", contact)
                    console.log("🚀 ~ msg:", msg);
                    console.log("//////////////////////////////////////////////////////////////////////////////////////////////////");

                    const sendMessageText = await sendMessage(msg, whatsappId, `55${contact}`);
                    await sleep(randomValue(5, 10));
                  }
                }
              } catch (error) {
                console.error(error);
              }
            }
          }

          processDates();

        }

        //##############EXECUTANDO AS FUNÇÕES#################
        await Promise.all([
          faturasVencidas()
        ]);
      }




    });
    job.start();
  });

}
