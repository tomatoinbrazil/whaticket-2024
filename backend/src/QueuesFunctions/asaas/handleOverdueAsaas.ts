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
import Contact from "../../models/Contact";
import FindOrCreateTicketService from "../../services/TicketServices/FindOrCreateTicketService";
import CreateOrUpdateContactService from "../../services/ContactServices/CreateOrUpdateContactService";
import UpdateTicketService from "../../services/TicketServices/UpdateTicketService";
import GetProfilePicUrl from "../../services/WbotServices/GetProfilePicUrl";

const fs = require('fs')
const CronJob = require("cron").CronJob;
const axios = require("axios").default;

function parseToMilliseconds(seconds) {
  return seconds * 1000;
}
async function sleep(seconds) {
  /*   logger.info(
      `Sleep de ${seconds} segundos iniciado: ${moment().format("HH:mm:ss")}`
    ); */
  return new Promise((resolve) => {
    setTimeout(() => {
      /*       logger.info(
              `Sleep de ${seconds} segundos finalizado: ${moment().format(
                "HH:mm:ss"
              )}`
            ); */
      resolve(true);
    }, parseToMilliseconds(seconds));
  });
}
function randomValue(min, max) {
  return Math.floor(Math.random() * max) + min;
}


export async function handleOverdueAsaas() {
  const companies = await Company.findAll();
  companies.map(async (c) => {
    const companyId = c.id;
    const options1: FindOptions = {
      where: {
        companyId,
        name: "asaas",
      },
    };

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

    async function formatBRNumber(jid: string) {
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

    async function createJid(number: string) {
      if (number.includes('@g.us') || number.includes('@s.whatsapp.net')) {
        return await formatBRNumber(number) as string;
      }
      return number.includes('-')
        ? `${number}@g.us`
        : `${formatBRNumber(number)}@s.whatsapp.net`;
    }



    async function sendMessageLink(msg: string, whatsappId: any, url: any, number: string) {
      const wbot = await getWbot(whatsappId);
      const id = await formatBRNumber(number);
      console.log("//////////////////////////////////////////////////////////////////////////////")
      console.log("🚀 ~ sendMessageLink ~ id:", id)
      const profilePicUrl = await GetProfilePicUrl(number, companyId);

      const contactData = {
        name: `${id}`,
        id,
        profilePicUrl,
        isGroup: false,
        companyId
      };

      const contactVerify = await Contact.findOne({
        where: { companyId, number: id },
      });


      try {
        const sendingLink = await wbot.sendMessage(
          `${id}@s.whatsapp.net`, {
          document: url ? { url } : fs.readFileSync(`public/temp/Boleto-${makeid(10)}`),
          fileName: "Boleto.pdf",
          caption: msg,
          mimetype: 'application/pdf'
        });
        console.log("🚀 ~ sendMessageLink ~ sendingLink:", sendingLink)
        const ticket = await FindOrCreateTicketService(contactVerify, wbot.id!, 0, companyId);
        logger.info(`Mensagem enviado para - ${id} - Ticket: ${ticket.id}`);
        await UpdateTicketService({
          ticketId: ticket.id,
          ticketData: { status: "closed", user_api_hash: null },
          companyId
        });
      } catch (error) {
        //logger.error(error)
        console.log("🚀 ~ sendMessageLink ~ sendMessageLink:", error);
      }
      console.log("//////////////////////////////////////////////////////////////////////////////")
    };

    async function sendMessage(msg: string, whatsappId: any, number: string) {
      const wbot = await getWbot(whatsappId);
      const id = await formatBRNumber(number);
      console.log("//////////////////////////////////////////////////////////////////////////////")
      console.log("🚀 ~ sendMessage ~ id:", id)
      const profilePicUrl = await GetProfilePicUrl(number, companyId);

      const contactData = {
        name: `${id}`,
        id,
        profilePicUrl,
        isGroup: false,
        companyId
      };

      const contactVerify = await Contact.findOne({
        where: { companyId, number: id },
      });

      try {
        const sendingText = await wbot.sendMessage(`${id}@s.whatsapp.net`, { text: msg, });

        console.log("🚀 ~ sendMessage ~ sendingText:", sendingText)
        const ticket = await FindOrCreateTicketService(contactVerify, wbot.id!, 0, companyId);

        logger.info(`Mensagem enviado para - ${id} - Ticket: ${ticket.id}`);

        await UpdateTicketService({
          ticketId: ticket.id,
          ticketData: { status: "closed", user_api_hash: null },
          companyId
        });
      } catch (error) {
        //logger.error(error)
        console.log("🚀 ~ sendMessage ~ sendMessage:", error);
      }
      console.log("//////////////////////////////////////////////////////////////////////////////")
    };



    //////////////////////////////////////////////////////////////////////////////////////////////////
    //                             VERIFICA A HORA PARA ENVIAR AS MENSAGENS                         //
    //////////////////////////////////////////////////////////////////////////////////////////////////
    const job = new CronJob("0 * * * * *", async () => {
      logger.info("Iniciando verificação envios Asaas");

      const integration = await Integration.findAll(options1);

      let tokenAsaas = integration[0]?.token;
      let envioAnt = integration[0]?.envioAnt;
      let vencMax = 90; // DIAS MAXIMOS PARA ENVIAR APOS O VENCIMENTO
      let envioAposVenc = integration[0]?.envioAposVenc;
      let msgAntVenc = integration[0]?.msgAntVenc;
      let msgVenc = integration[0]?.msgVenc;
      let msgAposVenc = integration[0]?.msgAposVenc;
      let hora = integration[0]?.hora;
      let whatsappId = integration[0]?.whatsappId;
      const whatsapp = await Whatsapp.findByPk(whatsappId);
      let tokenWhatsapp = whatsapp?.token;


      const hours = moment().format("HH:mm");
      const urlBackend = process.env.BACKEND_URL;
      let quant3 = 0
      let quant2 = 0
      let quant1 = 0
      if (hours === hora) {
        logger.info("Horario pragramado para envio encontrado");
        //////////////////////////////////////////////////////////////////////////////////////////////////
        //                   ENVIANDO NOTIFICAÇÃO PARA CLIENTES COM FATURAS EM ABERTO                   //
        //////////////////////////////////////////////////////////////////////////////////////////////////

        async function faturasAbertas() {

          async function getCustomerPending(customer) {
            //names = []
            let config1 = {
              method: "get",
              maxBodyLength: Infinity,
              url: "https://api.asaas.com/v3/customers/" + customer["customer"],
              params: { limit: "500" },
              headers: {
                "Content-Type": "application/json",
                access_token: tokenAsaas,
              },
            };
            try {
              const response1 = await axios.request(config1);
              const id = customer["id"];
              const name = response1.data["name"];
              const dueDate = moment(customer["dueDate"]).format("DD/MM/YYYY");
              const netValue = customer["value"];
              const mobilePhone = response1.data["mobilePhone"];
              const mobilePhoneValid = await formatBRNumber(mobilePhone);

              const invoiceUrl = customer["invoiceUrl"];
              const invoiceNumber = customer["invoiceNumber"];
              const bankSlipUrl = customer["bankSlipUrl"];

              const whatsapp = await Whatsapp.findByPk(whatsappId);
              var msg = msgAntVenc.replace(/%name%/g, name);
              var msg = msg.replace(/%venc%/g, dueDate);
              var msg = msg.replace(/%valor%/g, currencyFormat(netValue));
              var msg = msg.replace(/%invoiceNumber%/g, invoiceNumber);
              var msg = msg.replace(/%link%/g, invoiceUrl);


              console.log(`${moment().format("HH:mm:ss")} - ${name} - ABERTO  `)
              /* ALTEREAR NUMERO PARA VARIAVEL"mobilePhone" */

              if (bankSlipUrl) {
                await sendMessageLink(msg, whatsappId, bankSlipUrl, `55${mobilePhoneValid}`)

              } else {
                await sendMessage(msg, whatsappId, `55${mobilePhoneValid}`)
              }
              ++quant2;
              await sleep(randomValue(5, 10))
              msg = "";
              msg = "";
              //return
            } catch (error) {
              console.log(error.code);
            }
          }

          const dateHoje = new Date();
          const dateVenc = moment(dateHoje.setDate(dateHoje.getDate() + envioAnt)).format("YYYY-MM-DD");

          let configPending = {
            method: "get",
            maxBodyLength: Infinity,
            url: "https://api.asaas.com/v3/payments",
            params: {
              "dueDate[ge]": dateVenc,
              "dueDate[le]": dateVenc,
              limit: "100",
              status: "PENDING",
            },
            headers: {
              "Content-Type": "application/json",
              access_token: tokenAsaas,
            },
          };

          try {
            const response = await axios.request(configPending);
            let offset = 0;
            let totalCount = response.data["totalCount"];
            console.log("🚀 ~ faturasAbertas ~ totalCount:", totalCount)
            let pages = Math.floor(totalCount / 100);
            for (let i = 0; i <= pages; i++) {
              let config1 = {
                method: "get",
                maxBodyLength: Infinity,
                url: "https://api.asaas.com/v3/payments",
                params: {
                  "dueDate[ge]": dateVenc, "dueDate[le]": dateVenc, status: "PENDING", limit: "100", offset: `${offset}`
                },
                headers: {
                  "Content-Type": "application/json",
                  access_token: tokenAsaas,
                },
              };

              let response1 = await axios.request(config1)
              for (let i = 0; i < response1.data.data.length; i++) {
                let customer = response1.data.data[i];
                await getCustomerPending(customer);
                await sleep(2);
              }
              offset = offset + 100;
            }
          } catch (error) {
            console.log(error);
            return error.code;
          }
        }

        //////////////////////////////////////////////////////////////////////////////////////////////////
        //              ENVIANDO NOTIFICAÇÃO PARA CLIENTES COM VENCIMENTO NA DATA DE HOJE               //
        //////////////////////////////////////////////////////////////////////////////////////////////////

        async function faturasHoje() {

          async function getCustomerDueDate(customer) {
            //names = []
            let config1 = {
              method: "get",
              maxBodyLength: Infinity,
              url: "https://api.asaas.com/v3/customers/" + customer["customer"],
              params: { limit: "500" },
              headers: {
                "Content-Type": "application/json",
                access_token: tokenAsaas,
              },
            };
            try {
              const response1 = await axios.request(config1);
              const id = customer["id"];
              const name = response1.data["name"];
              const dueDate = moment(customer["dueDate"]).format("DD/MM/YYYY");
              const netValue = customer["value"];
              const mobilePhone = response1.data["mobilePhone"];
              const invoiceUrl = customer["invoiceUrl"];
              const invoiceNumber = customer["invoiceNumber"];
              const bankSlipUrl = customer["bankSlipUrl"];
              const mobilePhoneValid = await formatBRNumber(mobilePhone);

              console.log(`${moment().format("HH:mm:ss")} - ${quant1} - ${name} - Data de Hoje: `)
              const whatsapp = await Whatsapp.findByPk(whatsappId);
              var msg = msgVenc.replace(/%name%/g, name);
              var msg = msg.replace(/%venc%/g, dueDate);
              var msg = msg.replace(/%valor%/g, currencyFormat(netValue));
              var msg = msg.replace(/%invoiceNumber%/g, invoiceNumber);
              var msg = msg.replace(/%link%/g, invoiceUrl);

              if (bankSlipUrl) {
                await sendMessageLink(msg, whatsappId, bankSlipUrl, `55${mobilePhoneValid}`)
              } else {
                await sendMessage(msg, whatsappId, `55${mobilePhoneValid}`)
              }
              ++quant1;
              await sleep(randomValue(5, 10))
              msg = "";
              msg = "";
            } catch (error) {
              console.log(error.code);
            }
          }

          const hoje = moment().format("YYYY-MM-DD");
          let configDueDate = {
            method: "get",
            maxBodyLength: Infinity,
            url: "https://api.asaas.com/v3/payments",
            params: {
              "dueDate[ge]": hoje, "dueDate[le]": hoje, limit: "500", status: "PENDING",
            },
            headers: {
              "Content-Type": "application/json",
              access_token: tokenAsaas,
            },
          };

          try {
            const response = await axios.request(configDueDate);
            let offset = 0;
            let totalCount = response.data["totalCount"];
            console.log("🚀 ~ faturasHoje ~ totalCount:", totalCount)
            let pages = Math.floor(totalCount / 100);
            for (let i = 0; i <= pages; i++) {
              let config1 = {
                method: "get",
                maxBodyLength: Infinity,
                url: "https://api.asaas.com/v3/payments",
                params: {
                  "dueDate[ge]": hoje, "dueDate[le]": hoje, status: "PENDING", limit: "100", offset: `${offset}`
                },
                headers: {
                  "Content-Type": "application/json",
                  access_token: tokenAsaas,
                },
              };

              let response1 = await axios.request(config1)
              for (let i = 0; i < response1.data.data.length; i++) {
                let customer = response1.data.data[i];
                await getCustomerDueDate(customer);
                await sleep(2);
              }


              offset = offset + 100;
            }
          } catch (error) {
            console.log(error.code);
            return error.code;
          }
        }

        //////////////////////////////////////////////////////////////////////////////////////////////////
        //                    ENVIANDO NOTIFICAÇÃO PARA CLIENTES COM FATURAS VENCIDAS                   //
        //////////////////////////////////////////////////////////////////////////////////////////////////
        async function faturasVencidas() {
          async function getCustomer(customer) {

            let config1 = {
              method: "get",
              maxBodyLength: Infinity,
              url: "https://api.asaas.com/v3/customers/" + customer["customer"],
              params: { limit: "1" },
              headers: {
                "Content-Type": "application/json",
                access_token: tokenAsaas,
              },
            };

            const response1 = await axios.request(config1)
            const id = customer["id"];
            const name = response1.data["name"];
            const dueDate = moment(customer["dueDate"]).format("DD/MM/YYYY");
            const netValue = customer["value"];
            //const mobilePhone = response1.data["mobilePhone"];
            const mobilePhone = response1.data["mobilePhone"];
            const invoiceUrl = customer["invoiceUrl"];
            const invoiceNumber = customer["invoiceNumber"];
            const bankSlipUrl = customer["bankSlipUrl"];
            const dateHoje = new Date();
            const dateVenc = new Date(customer["dueDate"]);
            const diffInMs = dateHoje.getTime() - dateVenc.getTime();
            const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
            const diffFormat = Number(diffInDays.toFixed(0));
            const mobilePhoneValid = await formatBRNumber(mobilePhone);

            if (diffFormat < vencMax) {
              if (diffFormat % envioAposVenc === 0) {
                const regex = /somos/g;
                var msg = msgAposVenc.replace(/%name%/g, name);
                msg = msg.replace(/%venc%/g, dueDate);
                msg = msg.replace(/%valor%/g, currencyFormat(netValue));
                msg = msg.replace(/%invoiceNumber%/g, invoiceNumber);
                msg = msg.replace(/%link%/g, invoiceUrl);

                if (bankSlipUrl) {
                  await sendMessageLink(msg, whatsappId, bankSlipUrl, `55${mobilePhoneValid}`)
                } else {
                  await sendMessage(msg, whatsappId, `55${mobilePhoneValid}`)
                }
                quant3++;
                await sleep(randomValue(5, 10))
                msg = "";
                return
              }
            }



            //return
          }
          let config = {
            method: "get",
            maxBodyLength: Infinity,
            url: "https://api.asaas.com/v3/payments",
            params: { "": "", status: "OVERDUE", limit: "25" },
            headers: {
              "Content-Type": "application/json",
              access_token: tokenAsaas,
            },
          };

          try {
            //PEGAR QUANTIDADE DE FATURAS VENCIDAS
            const response = await axios.request(config);
            let offset = 0;
            let totalCount = response.data["totalCount"];
            console.log("🚀 ~ faturasVencidas ~ totalCount:", totalCount)
            let pages = Math.floor(totalCount / 100);
            for (let i = 0; i <= pages; i++) {
              let configPages = {
                method: "get",
                maxBodyLength: Infinity,
                url: "https://api.asaas.com/v3/payments",
                params: {
                  status: "OVERDUE", limit: "100", offset: `${offset}`
                },
                headers: {
                  "Content-Type": "application/json",
                  access_token: tokenAsaas,
                },
              };

              let responsePages = await axios.request(configPages)
              for (let i = 0; i < responsePages.data.data.length; i++) {
                let customer = responsePages.data.data[i];
                await getCustomer(customer);
                await sleep(2);
              }

              offset = offset + 100;
            }
          } catch (error) {
            //console.log("Error: ", error.code);
            return error.code;
          }

        }

        //##############EXECUTANDO AS FUNÇÕES#################

        await faturasAbertas()
        await faturasHoje()
        await faturasVencidas()

        logger.error("ENVIOS FINALIZADOS");
        logger.error(`FATURAS ABERTAS ENVIDAS: ${quant2}`);
        logger.error(`FATURAS DE HOJE ENVIDAS: ${quant1}`);
        logger.error(`FATURAS VENCIDAS ENVIDAS: ${quant3}`);
      }




    });
    job.start();
  });

}
