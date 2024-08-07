import { isNil, isEmpty } from 'lodash';
import { proto, WASocket } from "@whiskeysockets/baileys";
import Contact from "../../models/Contact";
import Setting from "../../models/Setting";
import Ticket from "../../models/Ticket";
import moment from "moment";
import { getBodyMessage, isNumeric, sleep, validaCpfCnpj, sendMessageImage, sendMessageLink, makeid } from "./wbotMessageListener";
import formatBody from "../../helpers/Mustache";

import puppeteer from "puppeteer";

import axios from 'axios';
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import fs from 'fs';
import { randomInt } from 'crypto';
import { logger } from '../../utils/logger';
import { differenceInDays, parseISO } from 'date-fns';


// Função auxiliar para remover caracteres não numéricos
function removeNonNumeric(str: string): string {
    return str.replace(/\D/g, '');
}

// Função para validar CPF e CNPJ
function isValidCpfOrCnpj(value: string): boolean {
    value = removeNonNumeric(value);

    if (value.length === 11) {
        return isValidCPF(value);
    } else if (value.length === 14) {
        return isValidCNPJ(value);
    } else {
        return false;
    }
}

// Função para validar CPF
function isValidCPF(cpf: string): boolean {
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
        return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;

    return true;
}

// Função para validar CNPJ
function isValidCNPJ(cnpj: string): boolean {
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) {
        return false;
    }

    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    let digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
}

async function sendBodyMessage(body: any, wbot: WASocket, msg: proto.IWebMessageInfo, ticket: Ticket) {
    body = {
        text: formatBody(body),
        ticket
    };
    await wbot.sendPresenceUpdate('composing', msg.key.remoteJid)
    await sleep(randomInt(1000, 2500))
    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
}

async function getInvoice(cpfCnpj: string, token: string) {
    var options = {
        method: 'GET',
        url: 'https://acesso.siprov.com.br/siprov-api/ext/financeiro/titulo',
        params: { tipo: "Crédito", cpfCnpj: cpfCnpj, situacao: "Aberto" },
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
        url: `https://acesso.siprov.com.br/siprov-api//ext/financeiro/titulo/${id}/boleto`,
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    const response = await axios.request(options)
    return response.data;
}

async function getAccessToken(token: string) {
    var options = {
        method: 'POST',
        url: 'https://acesso.siprov.com.br/siprov-api/ext/autenticacao',
        headers: {
            Authorization: `Basic ${token}`
        }
    };

    try {
        const response = await axios.request(options)
        return response.data.authorizationToken;
    } catch (error) {
        console.log("🚀 ~ getAccessToken ~ error:", error)
        logger.warn("Falha ao obter token de acesso - Siprov")
    }

}

async function getInvoiceBoleto(cpfCnpj: string, token: string) {
    var options = {
        method: 'GET',
        url: 'https://acesso.siprov.com.br/siprov-api//ext/financeiro/titulo/boleto',
        params: { cpfCnpj: cpfCnpj },
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    try {
        const response = await axios.request(options)
        return response.data.itens[0];
    } catch (error) {
        console.log("🚀 ~ getInvoiceBoleto ~ error:", error)
    }
}

function isValid(value: any): boolean {
    return !isNil(value) && !isEmpty(value);
}

function currencyFormat(value) {
    const formattedValue = value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
    return formattedValue;
}

export const handleSiprovQueue = async (ticket: Ticket, msg: proto.IWebMessageInfo, companyId: number, contact: Contact, wbot: WASocket, siprovUser: string, siprovPass: string) => {
    const filaescolhida = ticket.queue?.name

    if (filaescolhida === "2ª Via de Boleto" || filaescolhida === "2 Via de Boleto" || filaescolhida === "2ª Via de Boleto - PIX") {
        let cpfcnpj = getBodyMessage(msg);
        cpfcnpj = cpfcnpj.replace(/[./\-,\s]/g, '');
        const siprovEncoded = btoa(`${siprovUser}:${siprovPass}`);


        if (isValid(siprovUser) && isValid(siprovPass)) {
            if (isNumeric(cpfcnpj)) {
                if (cpfcnpj.length == 11 || cpfcnpj.length == 14) {
                    const isCPFCNPJ = isValidCpfOrCnpj(cpfcnpj)
                    if (isCPFCNPJ) {
                        let body = `⏳ Aguarde! Estamos consultando na base de dados!`;
                        try {
                            const token = await getAccessToken(siprovEncoded);
                            await sendBodyMessage(body, wbot, msg, ticket);
                            const invoice = await getInvoice(cpfcnpj, token);
                            if (invoice.quantidade > 0) {
                                const element = invoice.itens[0];
                                const codTitulo = element.codTitulo;
                                const codPessoa = element.codPessoa;
                                const cpfCnpjPessoa = element.cpfCnpjPessoa;
                                const nomeLoja = element.nomeLoja;
                                const nomeDevedorCredor = element.nomeDevedorCredor;
                                const tipo = element.tipo;
                                const descricao = element.descricao;
                                const dataEmissao = element.dataEmissao;
                                const dataVencimento = element.dataVencimento;
                                const valor = currencyFormat(element.valor);
                                const situacao = element.situacao;

                                const [dia, mes, ano] = dataVencimento.split('/');
                                const vencimento = new Date(`${ano}-${mes}-${dia}`);
                                const hoje = new Date();


                                let body = `👋 Olá *${nomeDevedorCredor}*, encontrei seu cadastro!\n\n 🔍 Estou realizando mais algumas verificações.\n\nPor favor, aguarde um momento. 😊`;
                                await sendBodyMessage(body, wbot, msg, ticket);

                                if (vencimento.getTime() >= hoje.getTime()) {
                                    let body = `🎉 *Excelente Notícia!* 🎉\n\nNão identifiquei nenhuma fatura vencida associada ao seu cadastro! Mas vou enviar a próxima fatura pra você!`;

                                    await sendBodyMessage(body, wbot, msg, ticket);

                                    const returnInvoiceBoleto = await getInvoiceBoleto(cpfcnpj, token);

                                    const { codBoleto, codTitulo, codPessoa, cpfCnpjPessoa, nomeLoja, nomePessoa, celular, tipo, descricao, dataEmissao, dataVencimento, valor, linhaDigitavel, urlPdf, chavePix } = returnInvoiceBoleto;

                                    body = `🔢 *Número do Título*: ${codTitulo}\n🏬 *Loja*: ${nomeLoja}\n👤 *Nome*: ${nomePessoa}\n📝 *Descrição*: ${descricao}\n📅 *Data de Vencimento*: ${dataVencimento}\n💰 *Valor*: ${valor}`;


                                    await sendBodyMessage(body, wbot, msg, ticket);

                                    body = `🔍 Este é o código de barras`;

                                    await sendBodyMessage(body, wbot, msg, ticket);
                                    await sendBodyMessage(linhaDigitavel, wbot, msg, ticket);
                                    body = `✨ Este é o PIX Copia e cola`;

                                    await sendBodyMessage(body, wbot, msg, ticket);
                                    await sendBodyMessage(chavePix, wbot, msg, ticket);

                                    await sendMessageLink(wbot, ticket.contact, ticket, urlPdf, "Boleto.pdf");

                                    body = `🌟 Obrigado, *${nomeDevedorCredor}*! \n\nSe precisar de mais alguma ajuda, estaremos à disposição!`;
                                    await sendBodyMessage(body, wbot, msg, ticket);

                                    await UpdateTicketService({
                                        ticketData: { status: "closed", userId: null, user_api_hash: null },
                                        ticketId: ticket.id,
                                        companyId: ticket.companyId,

                                    });
                                } else {
                                    const diffDays = differenceInDays(hoje, vencimento);
                                    if (diffDays <= 3) {
                                        let body = `🔔 *Atenção!* 🔔\n\nNotei que você possui uma fatura vencida no dia *${dataVencimento}*, com o valor de *${valor}*, vou enviar para você os dados dela para pagamento!`;

                                        await sendBodyMessage(body, wbot, msg, ticket);

                                        body = `🔢 *Número do Título*: ${codTitulo}\n🏬 *Loja*: ${nomeLoja}\n👤 *Nome*: ${nomeDevedorCredor}\n📝 *Descrição*: ${descricao}\n📅 *Data de Vencimento*: ${dataVencimento}\n💰 *Valor*: ${valor}`;


                                        await sendBodyMessage(body, wbot, msg, ticket);

                                        const dataInvoice = await getInvoicePayment(codTitulo, token)
                                        const linhaDigitavel = dataInvoice.linhaDigitavel
                                        const chavePix = dataInvoice.chavePix

                                        body = `🔍 Este é o código de barras`;

                                        await sendBodyMessage(body, wbot, msg, ticket);
                                        await sendBodyMessage(linhaDigitavel, wbot, msg, ticket);
                                        body = `✨ Este é o PIX Copia e cola`;

                                        await sendBodyMessage(body, wbot, msg, ticket);
                                        await sendBodyMessage(chavePix, wbot, msg, ticket);

                                        body = `🌟 Obrigado, *${nomeDevedorCredor}*! \n\nSe precisar de mais alguma ajuda, estaremos à disposição!`;
                                        await sendBodyMessage(body, wbot, msg, ticket);

                                        await UpdateTicketService({
                                            ticketData: { status: "closed", userId: null, user_api_hash: null },
                                            ticketId: ticket.id,
                                            companyId: ticket.companyId,

                                        });

                                    } else {
                                        const body = `🔔 *Atenção!* 🔔\n\nNotei que você possui uma fatura vencida no dia *${dataVencimento}*, com o valor de *${valor}*, e como está com mais de 3 dias, é necessário que você entre em contato com nosso atendimento. \n\nDigite *#* e escolha a opção para falar com atendente!`;
                                        await sendBodyMessage(body, wbot, msg, ticket);
                                    }
                                }
                            } else {
                                const body = { text: formatBody(`Este CPF/CNPJ não possui boletos pendentes!\n\nPor favor tente novamente!\nOu digite *#* para voltar ao *Menu Anterior*`, ticket) };
                                await sendBodyMessage(body, wbot, msg, ticket);
                            }


                        } catch (error) {
                            console.log("🚀 ~ handleSiprovQueue ~ error:", error)
                        }
                    } else {
                        const body = `Este CPF/CNPJ não é válido!\n\nPor favor tente novamente!\nOu digite *#* para voltar ao *Menu Anterior*`;
                        await sleep(2000)
                        await sendBodyMessage(body, wbot, msg, ticket);
                    }
                }
            }


        }
    }


}
