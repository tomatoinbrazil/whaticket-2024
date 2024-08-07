import Integration from "../../models/Integration";
import AppError from "../../errors/AppError";
import { FindOptions } from "sequelize/types";
import moment from "moment";

var axios = require("axios").default;
let names: {
    id: string;
    name: string;
    dueDate: string;
    netValue: string;
    mobilePhone: any;
    invoiceUrl: string;
    invoiceNumber: string;
}[] = [];

interface Request {
    companyId: number;
}

const SGAOverdueService = async (companyId: string | number) => {
    const options1: FindOptions = {
        where: {
            companyId,
            name: "sga",
        },
    };

    const integration = await Integration.findAll(options1);
    let token = integration[0]?.token;
    const dataInicioVencidos = moment().subtract(1, 'days').format("DD/MM/YYYY");
    const dataFinalVencidos = moment().subtract(61, 'days').format("DD/MM/YYYY");

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


    async function getAssociadoCodigo(codigo_associado) {
        let telefone_celular;
        return new Promise(async (resolve) => {
            var options = {
                method: 'GET',
                url: `https://api.hinova.com.br/api/sga/v2/associado/buscar/${codigo_associado}/codigo`,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
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


    async function getBoleto(nosso_numero) {
        const array_boleto: Array<{ linhadigitavel: string; link_boleto: string; copia_cola: string; }> = [];
        return new Promise(async (resolve) => {
            var options = {
                method: 'GET',
                url: `https://api.hinova.com.br/api/sga/v2/buscar/boleto/${nosso_numero}`,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
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

    var optionsVencidos = {
        method: 'POST',
        url: 'https://api.hinova.com.br/api/sga/v2/listar/boleto',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        data: {
            codigo_situacao: '2', //ABERTO
            data_vencimento_inicial: `${dataFinalVencidos}`,
            data_vencimento_final: `${dataInicioVencidos}` //DATA DE VENCIMENTO
        }
    };
    axios.request(optionsVencidos).then(async function (response) {
        console.log("🚀 Console Log : response:", response);
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

            names.push({
                id: codigo_associado,
                name: nome_associado,
                dueDate: data_vencimento,
                netValue: valor_boleto,
                mobilePhone: telefone_celular,
                invoiceUrl: link_boleto,
                invoiceNumber: nosso_numero,
            });
            //await sendMessageSGA(msgAposVenc, nome_associado, data_vencimento, valor_boleto, nosso_numero, link_boleto, telefone_celular, linhadigitavel, copia_cola)

        }
        //let unique = [...new Map(names.map((m) => [m.id, m])).values()];

        /* while (names.length > 0) {
            names.pop();
        } */
        console.log("🚀 Console Log : names:", names);
        return await names;
    }).catch(async function (error) {
        console.log("🚀 Console Log : error.response.data:", error?.response);
    });
};

export default SGAOverdueService;
