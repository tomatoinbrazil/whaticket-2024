import { Response } from 'express';
import { FindOptions } from "sequelize/types";
import moment from "moment";

import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import Integration from "../../models/Integration";
import Company from "../../models/Company";



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




export async function hinovaSGA() {

  const companies = await Company.findAll();
  companies.map(async (c) => {
    const companyId = c.id;
    const options1: FindOptions = {
      where: {
        companyId,
        name: "sga",
      },
    };

    function currencyFormat(value) {
      const formattedValue = value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      return formattedValue;
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////
    //                             VERIFICA A HORA PARA ENVIAR AS MENSAGENS                         //
    //////////////////////////////////////////////////////////////////////////////////////////////////
    const job = new CronJob("0 * * * * *", async () => {
      logger.info("Iniciando verificação envios SGA");
      //VARIAVEIS SGA
      const integration = await Integration.findAll(options1)
      const tokenSGA = integration[0]?.token;
      const envioAnt = integration[0]?.envioAnt;
      const envioAposVenc = integration[0]?.envioAposVenc;
      const msgAntVenc = integration[0]?.msgAntVenc;
      const msgVenc = integration[0]?.msgVenc;
      const msgAposVenc = integration[0]?.msgAposVenc;
      const hora = integration[0]?.hora;
      const whatsappId = integration[0]?.whatsappId;
      const whatsapp = await Whatsapp.findByPk(whatsappId);
      const tokenWhatsapp = whatsapp?.token;
      const urlBackend = process.env.BACKEND_URL; //URL Backend
      const hoje = moment().format("DD/MM/YYYY"); //Data de Hoje
      const dataInicioVencidos = moment().subtract(1, 'days').format("DD/MM/YYYY");
      const dataFinalVencidos = moment().subtract(61, 'days').format("DD/MM/YYYY");
      const dataVencer = moment().add(envioAnt, 'days').format("DD/MM/YYYY");
      const hours = moment().format("HH:mm");

      if (hours === hora) {
        logger.info(`Horario de envio encontrado na ${companyId} - ${c.name}`);
        async function sendMessageSGA(msg, nome_associado, data_vencimento, valor_boleto, nosso_numero, link_boleto, telefone_celular, linhadigitavel, copia_cola) {
          try {
            let msgEnviar = msg.replaceAll("%name%", nome_associado);
            msgEnviar = msgEnviar.replaceAll("%venc%", data_vencimento);
            msgEnviar = msgEnviar.replaceAll("%valor%", currencyFormat(valor_boleto));
            msgEnviar = msgEnviar.replaceAll("%invoiceNumber%", nosso_numero);
            msgEnviar = msgEnviar.replaceAll("%link%", link_boleto);

            /* ALTEREAR NUMERO PARA VARIAVEL"mobilePhone" */
            var options = {
              method: 'POST',
              url: `${urlBackend}/api/messages/send`,
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenWhatsapp}`
              },
              data: { number: `${telefone_celular}`, body: msgEnviar }
            };

            await axios.request(options).then(async function (response) {
              logger.info(`Mensagem enviado para - ${nome_associado}`);
              return
            }).catch(async function (error) {
              logger.info(`Mensagem nao enviada para - ${nome_associado}`);
              return
            });
            await sleep(randomValue(5, 20))
            msg = "";
          } catch (error) {
            console.log(error.code);
          }
        }

        function formatNumber(number: string) {
          if (number.startsWith('55') && (number.length === 12 || number.length === 13)) {
            const dddi = number.substring(0, 2);
            const ddd = parseInt(number.substring(2, 4), 10);

            let userNumber: string;

            if (ddd < 30) {
              userNumber = number.length === 12 ? `9${number.substring(4)}` : number.substring(4);
            } else {
              userNumber = number.substring(0, 5) === '9' ? number.substring(5) : number.substring(4);
            }

            return `${dddi}${ddd}${userNumber}`;
          }
          return number;
        }

        async function getBoleto(nosso_numero) {
          const array_boleto: Array<{ linhadigitavel: string; link_boleto: string; copia_cola: string; }> = [];
          return new Promise(async (resolve) => {
            var options = {
              method: 'GET',
              url: `https://api.hinova.com.br/api/sga/v2/buscar/boleto/${nosso_numero}`,
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenSGA}`
              }
            };

            await axios.request(options).then(async function (response) {

              const linhadigitavel = response.data.linha_digitavel; //CODIGO DE BARRAS
              const link_boleto = response.data.link_boleto; // LINK BOLETO PDF
              const copia_cola = response.data.pix.copia_cola; // PIX COPIA E COLA
              const obj = { linhadigitavel: linhadigitavel, link_boleto: link_boleto, copia_cola: copia_cola }
              array_boleto.push(obj);

            }).catch(function (error) {
              console.error(error);
            });
            await resolve(array_boleto);
            //return array_boleto;
          }
          )
        }

        async function getAssociadoCodigo(codigo_associado) {
          let telefone_celular;
          return new Promise(async (resolve) => {
            var options = {
              method: 'GET',
              url: `https://api.hinova.com.br/api/sga/v2/associado/buscar/${codigo_associado}/codigo`,
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenSGA}`
              }
            };

            await axios.request(options).then(async function (response) {
              telefone_celular = await response.data.telefone_celular;
              telefone_celular = telefone_celular.replace(/[^0-9]+/g, '');
              telefone_celular = [telefone_celular.slice(0, 0), telefone_celular.slice(0)].join('55');
              telefone_celular = await formatNumber(telefone_celular);
            }).catch(function (error) {
              console.error(error);
            });
            await resolve(telefone_celular);
          }
          )
        }

        async function faturasHojeSga() {
          logger.info("Inicio Hoje");
          var optionsHojeSga = {
            method: 'POST',
            url: 'https://api.hinova.com.br/api/sga/v2/listar/boleto',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tokenSGA}`
            },
            data: {
              codigo_situacao: '2', //ABERTO
              data_vencimento_inicial: `${hoje}`,
              data_vencimento_final: `${hoje}` //DATA DE VENCIMENTO
            }
          };
          axios.request(optionsHojeSga).then(async function (response) {

            var filtrado = response?.data.filter(function (obj) { return obj.codigo_situacao_associado == 1 || obj.codigo_situacao_associado == 4; });

            for (let i = 0; i < response.data.length; i++) {
              const filtro = filtrado[i];
              const codigo_associado = filtro.codigo_associado;
              const nome_associado = filtro.nome_associado;
              const data_vencimento = moment(filtro.data_vencimento).format("DD/MM/YYYY");
              const valor_boleto = filtro.valor_boleto;
              const nosso_numero = filtro.nosso_numero;
              const telefone_celular = await getAssociadoCodigo(codigo_associado);
              const faturas = JSON.parse(JSON.stringify(await getBoleto(nosso_numero)))
              const linhadigitavel = faturas[0]['linhadigitavel']
              const link_boleto = faturas[0]['link_boleto']
              const copia_cola = faturas[0]['copia_cola']

              //Enviando Mensagem
              await sendMessageSGA(msgVenc, nome_associado, data_vencimento, valor_boleto, nosso_numero, link_boleto, telefone_celular, linhadigitavel, copia_cola)
              //console.log(nome_associado, " - ", data_vencimento, " - ", valor_boleto, " - ", nosso_numero, " - ", telefone_celular)
            }
            return
          }).catch(async function (error) {
            if (error.response.data.error[0] === "Boleto não encontrado ou está em alguma situação indisponível para consulta.") {
              logger.info(`Não existe boletos para enviar na data de ${hoje} - ${c.name}`);
            }
            return
          });
        }

        async function faturasVencidasSga() {
          var optionsVencidos = {
            method: 'POST',
            url: 'https://api.hinova.com.br/api/sga/v2/listar/boleto',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tokenSGA}`
            },
            data: {
              codigo_situacao: '2', //ABERTO
              data_vencimento_inicial: `${dataFinalVencidos}`,
              data_vencimento_final: `${dataInicioVencidos}` //DATA DE VENCIMENTO
            }
          };
          axios.request(optionsVencidos).then(async function (response) {
            //var filtrado = response.data.filter(function (obj) { return obj.codigo_situacao_associado == 1 || obj.codigo_situacao_associado == 4; });
            //var filtradoinativo = response.data.filter(function (obj) { return obj.codigo_situacao_associado == 2; });
            for (let i = 0; i < response.data.length; i++) {
              const filtro = response.data[i];
              const codigo_associado = filtro.codigo_associado;
              const nome_associado = filtro.nome_associado;
              const valor_boleto = filtro.valor_boleto;
              const nosso_numero = filtro.nosso_numero;
              const data_vencimento = moment(filtro.data_vencimento).format("DD/MM/YYYY");
              const telefone_celular = await getAssociadoCodigo(codigo_associado);
              const faturas = JSON.parse(JSON.stringify(await getBoleto(nosso_numero)))
              const linhadigitavel = faturas[0]['linhadigitavel']
              const link_boleto = faturas[0]['link_boleto']
              const copia_cola = faturas[0]['copia_cola']

              // VERIFICA SE ENVIOU FAZ x DIAS PARA ENVIAR NOVAMENTE
              const dateHoje = moment().format("DD/MM/YYYY");;
              const diff = moment(dateHoje, "DD/MM/YYYY").diff(moment(data_vencimento, "DD/MM/YYYY"));
              const dias = moment.duration(diff).asDays();

              if (dias % envioAposVenc === 0) {

                //console.log(nome_associado, " - ", data_vencimento, " - ", valor_boleto, " - ", nosso_numero, " - ", telefone_celular)
                await sendMessageSGA(msgAposVenc, nome_associado, data_vencimento, valor_boleto, nosso_numero, link_boleto, telefone_celular, linhadigitavel, copia_cola)
              }
            }
            return
          }).catch(async function (error) {
            if (error.response.data.error[0] === "Boleto não encontrado ou está em alguma situação indisponível para consulta.") {
              logger.info(`Não existe boletos para enviar na data de ${hoje} - ${c.name}`);
            }
            return
          });

        }

        async function faturasAbertasSga() {
          console.log("INICIANDO FATURAS ABERTAS")
          //return new Promise(async (resolve) => {
          var optionsAbertasSga = {
            method: 'POST',
            url: 'https://api.hinova.com.br/api/sga/v2/listar/boleto',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tokenSGA}`
            },
            data: {
              codigo_situacao: '2', //ABERTO
              data_vencimento_inicial: `${dataVencer}`,
              data_vencimento_final: `${dataVencer}` //DATA DE VENCIMENTO
            }
          };

          axios.request(optionsAbertasSga).then(async function (response) {
            var filtrado = response.data.filter(function (obj) { return obj.codigo_situacao_associado == 1 || obj.codigo_situacao_associado == 4; });
            var filtradoinativo = response.data.filter(function (obj) { return obj.codigo_situacao_associado == 2; });
            //console.log(filtrado.length)
            for (let i = 0; i < response.data.length; i++) {
              const filtro = filtrado[i];
              const codigo_associado = filtro.codigo_associado;
              const nome_associado = filtro.nome_associado;
              const data_vencimento = moment(filtro.data_vencimento).format("DD/MM/YYYY");
              const valor_boleto = filtro.valor_boleto;
              const nosso_numero = filtro.nosso_numero;
              const telefone_celular = await getAssociadoCodigo(codigo_associado);
              const faturas = JSON.parse(JSON.stringify(await getBoleto(nosso_numero)))
              const linhadigitavel = faturas[0]['linhadigitavel']
              const link_boleto = faturas[0]['link_boleto']
              const copia_cola = faturas[0]['copia_cola']


              //console.log(nome_associado, " - ", data_vencimento, " - ", valor_boleto, " - ", nosso_numero, " - ", telefone_celular)
              await sendMessageSGA(msgAntVenc, nome_associado, data_vencimento, valor_boleto, nosso_numero, link_boleto, telefone_celular, linhadigitavel, copia_cola)
            }
            return
          }).catch(async function (error) {
            console.log("🚀 ~ error:", error.response.data)
            if (error.response.data.error[0] === "Boleto não encontrado ou está em alguma situação indisponível para consulta.") {
              logger.info(`Não existe boletos para enviar na data de ${hoje} - ${c.name}`);
            }
            return
          });

          //})
        }

        //##############EXECUTANDO AS FUNÇÕES#################
        await faturasHojeSga();
        await faturasVencidasSga();
        await faturasAbertasSga();

      }
    })
    job.start();
  }
  )
}
