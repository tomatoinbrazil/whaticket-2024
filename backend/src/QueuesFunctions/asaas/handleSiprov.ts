import { isNil } from 'lodash';
import { index } from './../../controllers/FilesController';
import { date } from './../../helpers/Mustache';
import { Response } from 'express';
import { getAccessToken } from './../../services/FacebookServices/graphAPI';
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
import { addDays, differenceInDays, format, parse, startOfDay, subDays } from 'date-fns';
import { Op } from 'sequelize';
import Contact from '../../models/Contact';
import FindOrCreateTicketService from '../../services/TicketServices/FindOrCreateTicketService';

const fs = require('fs')
const CronJob = require("cron").CronJob;
const axios = require("axios").default;

interface MessageScheduler {
    dueDateString: string;  // Data de vencimento como string
    intervalDays: number;
    maxDaysAfterDue: number;
}

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


export async function handleOverdueSiprov() {
    const companies = await Company.findAll();
    companies.map(async (c) => {
        const companyId = c.id;
        const options1: FindOptions = {
            where: {
                companyId,
                name: "siprov",
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
            try {
                await wbot.sendMessage(
                    id, {
                    document: url ? { url } : fs.readFileSync(`public/temp/Boleto-${makeid(10)}`),
                    fileName: "Boleto.pdf",
                    caption: msg,
                    mimetype: 'application/pdf'
                });
                //const contactVerify = await Contact.findOne({
                //    where: { companyId, number },
                //   });
                //   const ticket = await FindOrCreateTicketService(contactVerify, whatsappId, 0, companyId);
                //    ticket.update({ status: "closed" });
                return true
            } catch (error) {
                logger.error(error)
                return false
            }

        };

        async function sendMessage(msg: string, whatsappId: any, number: string) {
            const wbot = await getWbot(whatsappId);
            const id = await createJid(number);
            try {
                await wbot.sendMessage(id, { text: msg, });
                //const contactVerify = await Contact.findOne({
                //    where: { companyId, number },
                //   });
                //   const ticket = await FindOrCreateTicketService(contactVerify, whatsappId, 0, companyId);
                //    ticket.update({ status: "closed" });
                return true
            } catch (error) {
                logger.error(error)
                return false
            }

        };

        async function getAccessToken(token) {
            const options = {
                method: 'POST',
                url: 'https://acesso.siprov.com.br/siprov-api/ext/autenticacao',
                headers: {
                    Authorization: `Basic ${token}`
                }
            };

            try {
                const response = await axios.request(options);
                return response.data.authorizationToken;
            } catch (error) {
                console.error(error);
                return null;  // Retorna null em caso de erro
            }
        }

        async function getBoletos(token: string, dateBefore: string) {
            var options = {
                method: 'GET',
                url: 'https://acesso.siprov.com.br/siprov-api/ext/financeiro/titulo/boleto',
                params: { dataVencimentoInicial: `${dateBefore}`, dataVencimentoFinal: `${dateBefore}` },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };
            try {
                const response = await axios.request(options);
                return response.data;
            } catch (error) {
                console.log("🚀 ~ getBoletos ~ error:", error)

            }
        }

        async function getInvoice(token: string, dueDate: string) {
            var options = {
                method: 'GET',
                url: 'https://acesso.siprov.com.br/siprov-api/ext/financeiro/titulo',
                params: { tipo: "Crédito", dataVencimentoInicial: dueDate, dataVencimentoFinal: dueDate, situacao: "Aberto" },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            try {
                const response = await axios.request(options);
                return response.data;

            } catch (error) {
                console.log("🚀 ~ getInvoice ~ error:", error)
                logger.warn("Falha ao obter boleto - Siprov")
            }
        }

        async function getInvoicePayment(id: string, token: string) {
            var options = {
                method: 'GET',
                url: `https://acesso.siprov.com.br/siprov-api/ext/financeiro/titulo/${id}/boleto`,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            const response = await axios.request(options)
            return response.data;
        }

        function addDaysToDate(env): string {
            const today = new Date();
            const dateInSixDays = addDays(today, env);
            return format(dateInSixDays, 'dd/MM/yyyy');
        }

        function removeDaysToDate(env): string {
            const today = new Date();
            const dateInSixDays = subDays(today, env);
            return format(dateInSixDays, 'dd/MM/yyyy');
        }

        async function getClient(token: string, id: string) {
            var options = {
                method: 'GET',
                url: `https://acesso.siprov.com.br/siprov-api/ext/associado`,
                params: { codPessoa: id },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            try {
                const response = await axios.request(options);
                if (response?.data[0]?.telefoneCelular === null) {
                    return false;
                } else {
                    return response?.data[0]?.telefoneCelular;
                }

            } catch (error) {
                console.log("🚀 ~ getInvoice ~ error:", error)
                logger.warn("Falha ao obter boleto - Siprov")
            }
        }

        async function getTitulos(token: string, id: string) {
            var options = {
                method: 'GET',
                url: `https://acesso.siprov.com.br/siprov-api/ext/financeiro/titulo/${id}/boleto`,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            const response = await axios.request(options)
            return response.data;
        }


        async function sendDailyCheck(scheduler: MessageScheduler, tokenValid: string, msgVenc: string, whatsappId: any): Promise<void> {
            const dueDate = startOfDay(parse(scheduler.dueDateString, 'dd/MM/yyyy', new Date()));

            const possibleSendDates = [];

            for (let i = 1; i * scheduler.intervalDays <= scheduler.maxDaysAfterDue; i++) {
                possibleSendDates.push(subDays(dueDate, i * scheduler.intervalDays));
            }


            for (let i = 0; i < possibleSendDates.length; i++) {
                const element = possibleSendDates[i];
                const boletos = await getInvoice(tokenValid, format(element, 'dd/MM/yyyy'));
                logger.warn(`Enviando para do dia: ${format(element, 'dd/MM/yyyy')} - Quantidade: ${boletos.quantidade}`);
                if (boletos.quantidade > 0) {
                    logger.info(`Ha ${boletos.quantidade} faturas para serem enviadas`);
                    for (let i = 0; i < boletos.itens.length; i++) {
                        const getTelefoneCelular = await getClient(tokenValid, boletos.itens[i].codPessoa);
                        const codTitulo = boletos.itens[i].codTitulo;
                        const nomeLoja = boletos.itens[i].nomeLoja;
                        const nomePessoa = boletos.itens[i].nomeDevedorCredor;
                        const dataVencimento = boletos.itens[i].dataVencimento;
                        const valor = currencyFormat(boletos.itens[i].valor);
                        const descricao = boletos.itens[i].descricao;
                        const telefoneCelular = `55${getTelefoneCelular?.replace(/[^a-zA-Z0-9]/g, '')}`;

                        const [dia, mes, ano] = dataVencimento.split('/');
                        const vencimento = new Date(`${ano}-${mes}-${dia}`);
                        const hoje = new Date();
                        const diffDays = differenceInDays(hoje, vencimento);

                        if (getTelefoneCelular) {
                            if (diffDays <= 3) {
                                const titulos = await getTitulos(tokenValid, codTitulo);
                                const { codBoleto, linhaDigitavel, chavePix } = titulos
                                var msg = msgVenc
                                    .replace(/%name%/g, nomePessoa)
                                    .replace(/%branchName%/g, nomeLoja)
                                    .replace(/%venc%/g, dataVencimento)
                                    .replace(/%valor%/g, valor)
                                    .replace(/%motivo%/g, descricao)
                                    .replace(/%chavePix%/g, '')
                                    .replace(/%codBoleto%/g, codTitulo);

                                await sendMessage(msg, whatsappId, telefoneCelular);
                                await sendMessage(chavePix, whatsappId, telefoneCelular);

                            } else {
                                var msg = msgVenc
                                    .replace(/%name%/g, nomePessoa)
                                    .replace(/%branchName%/g, nomeLoja)
                                    .replace(/%venc%/g, dataVencimento)
                                    .replace(/%valor%/g, valor)
                                    .replace(/%motivo%/g, descricao)
                                    .replace(/%codBoleto%/g, codTitulo);

                                await sendMessage(msg, whatsappId, telefoneCelular);
                            }
                        }


                        await sleep(randomValue(4, 7))

                    }
                    logger.info(`Envio de ${boletos.quantidade} faturas Finalizado`);
                } else {
                    logger.info("Nao ha faturas para serem enviadas");
                }
            }
        }

        //////////////////////////////////////////////////////////////////////////////////////////////////
        //                             VERIFICA A HORA PARA ENVIAR AS MENSAGENS                         //
        //////////////////////////////////////////////////////////////////////////////////////////////////
        const job = new CronJob("0 * * * * *", async () => {

            const integration = await Integration.findAll(options1);
            if (integration.length >= 1) {
                logger.info("Iniciando verificação envios - SIPROV");
                let tokenSipov = integration[0]?.token;
                let tokenName = integration[0]?.nameToken;
                let envioAnt = integration[0]?.envioAnt;
                let envioAposVenc = integration[0]?.envioAposVenc;
                let maxAposVenc = integration[0]?.maxAposVenc;
                let envDiaVenc = integration[0]?.envDiaVenc;
                let msgAntVenc = integration[0]?.msgAntVenc;
                let msgVenc = integration[0]?.msgVenc;
                let msgAposVenc = integration[0]?.msgAposVenc;
                let msg3AposVenc = integration[0]?.msg3AposVenc;
                let hora = integration[0]?.hora;
                let whatsappId = integration[0]?.whatsappId;
                const whatsapp = await Whatsapp.findByPk(whatsappId);
                const sipovb64 = btoa(`${tokenName}:${tokenSipov}`);
                const hours = moment().format("HH:mm");
                const urlBackend = process.env.BACKEND_URL;


                const dateHoje = new Date();
                const dateVenc = moment(dateHoje.setDate(dateHoje.getDate() - envioAposVenc)).format("YYYY-MM-DD");
                const dateBefore = addDaysToDate(envioAnt);
                const dateNow = addDaysToDate(0);
                const dateAfter = removeDaysToDate(envioAposVenc);


                if (hours === hora) {
                    logger.info("Horario pragramado para envio encontrado");
                    const tokenValid = await getAccessToken(sipovb64);
                    //////////////////////////////////////////////////////////////////////////////////////////////////
                    //                   ENVIANDO NOTIFICAÇÃO PARA CLIENTES COM FATURAS EM ABERTO                   //
                    //////////////////////////////////////////////////////////////////////////////////////////////////

                    async function faturasAntesVencimento() {
                        const dueDateBefore = await getBoletos(tokenValid, dateBefore);

                        if (dueDateBefore.quantidade > 0) {
                            logger.info(`Ha ${dueDateBefore.quantidade} faturas para serem enviadas`);
                            for (let i = 0; i < dueDateBefore.itens.length; i++) {
                                const codBoleto = dueDateBefore.itens[i].codBoleto;
                                const nomeLoja = dueDateBefore.itens[i].nomeLoja;
                                const nomePessoa = dueDateBefore.itens[i].nomePessoa;
                                const celular = `55${dueDateBefore.itens[i].celular.replace(/[^a-zA-Z0-9]/g, '')}`;
                                const dataVencimento = dueDateBefore.itens[i].dataVencimento;
                                const valor = currencyFormat(dueDateBefore.itens[i].valor);
                                const urlPdf = dueDateBefore.itens[i].urlPdf;
                                const chavePix = dueDateBefore.itens[i].chavePix;
                                const descricao = dueDateBefore.itens[i].descricao;

                                var msg = msgAntVenc.replace(/%name%/g, nomePessoa);
                                var msg = msg.replace(/%branchName%/g, nomeLoja);
                                var msg = msg.replace(/%venc%/g, dataVencimento);
                                var msg = msg.replace(/%valor%/g, valor);
                                var msg = msg.replace(/%motivo%/g, descricao);
                                var msg = msg.replace(/%chavePix%/g, '');
                                var msg = msg.replace(/%codBoleto%/g, codBoleto);
                                console.log("🚀 ~ faturasAntesVencimento ~ msg:", msg)

                                await sendMessageLink(msg, whatsappId, urlPdf, celular);
                                await sendMessage(chavePix, whatsappId, celular);
                                await sleep(randomValue(4, 7))

                            }
                            logger.info(`Envio de ${dueDateBefore.quantidade} faturas Finalizado`);
                        } else {
                            logger.info("Nao ha faturas para serem enviadas");
                        }
                    }

                    //////////////////////////////////////////////////////////////////////////////////////////////////
                    //              ENVIANDO NOTIFICAÇÃO PARA CLIENTES COM VENCIMENTO NA DATA DE HOJE               //
                    //////////////////////////////////////////////////////////////////////////////////////////////////

                    async function faturasVencimentoHoje() {
                        const dueDateNow = await getBoletos(tokenValid, dateNow);

                        if (envDiaVenc) {
                            if (dueDateNow.quantidade > 0) {
                                logger.info(`Ha ${dueDateNow.quantidade} faturas para serem enviadas`);
                                for (let i = 0; i < dueDateNow.itens.length; i++) {
                                    const codBoleto = dueDateNow.itens[i].codBoleto;
                                    const nomeLoja = dueDateNow.itens[i].nomeLoja;
                                    const nomePessoa = dueDateNow.itens[i].nomePessoa;
                                    const celular = `55${dueDateNow.itens[i]?.celular.replace(/[^a-zA-Z0-9]/g, '')}`;
                                    const dataVencimento = dueDateNow.itens[i].dataVencimento;
                                    const valor = currencyFormat(dueDateNow.itens[i].valor);
                                    const urlPdf = dueDateNow.itens[i].urlPdf;
                                    const chavePix = dueDateNow.itens[i].chavePix;
                                    const descricao = dueDateNow.itens[i].descricao;

                                    var msg = msgVenc.replace(/%name%/g, nomePessoa);
                                    var msg = msg.replace(/%branchName%/g, nomeLoja);
                                    var msg = msg.replace(/%venc%/g, dataVencimento);
                                    var msg = msg.replace(/%valor%/g, valor);
                                    var msg = msg.replace(/%motivo%/g, descricao);
                                    var msg = msg.replace(/%chavePix%/g, '');
                                    var msg = msg.replace(/%codBoleto%/g, codBoleto);

                                    await sendMessageLink(msg, whatsappId, urlPdf, celular);
                                    await sendMessage(chavePix, whatsappId, celular);
                                    await sleep(randomValue(4, 7))

                                }
                                logger.info(`Envio de ${dueDateNow.quantidade} faturas Finalizado`);
                            } else {
                                logger.info("Nao ha faturas para serem enviadas");
                            }
                        } else {
                            logger.info("Vencimento nao programado para envio - Configuracao Enviar no dia do Vencimento");
                        }
                    }

                    //////////////////////////////////////////////////////////////////////////////////////////////////
                    //                    ENVIANDO NOTIFICAÇÃO PARA CLIENTES COM FATURAS VENCIDAS                   //
                    //////////////////////////////////////////////////////////////////////////////////////////////////
                    async function faturasVencidas() {
                        const scheduler: MessageScheduler = {
                            dueDateString: dateAfter,
                            intervalDays: envioAposVenc,
                            maxDaysAfterDue: maxAposVenc
                        };

                        sendDailyCheck(scheduler, tokenValid, msg3AposVenc, whatsappId);

                    }

                    //##############EXECUTANDO AS FUNÇÕES#################
                    await faturasAntesVencimento(),
                        await faturasVencimentoHoje(),
                        await faturasVencidas()

                }

            }


        });
        job.start();
    });

}
