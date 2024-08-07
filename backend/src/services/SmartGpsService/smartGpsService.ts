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


type Session = WASocket & {
    id?: number;
};

interface Request {
    wbot: Session;
    msg: proto.IWebMessageInfo;
    ticket: Ticket;
    smartgps: QueueIntegrations;
}

interface IMe {
  name: string,
  id: string,
}


const smartGpsListener = async ({
    wbot,
    msg,
    ticket,
    smartgps,
}: Request): Promise<void> => {

    if (msg.key.remoteJid === 'status@broadcast') return;

    const {
      urlN8N: url,
    } = smartgps;

    const bodyMessage = getBodyMessage(msg);
    // const number = msg.key.remoteJid.replace(/\D/g, '');

    async function getUserHash(email: string, password: string) {
        try {

            const data = {
              email,
	            password,
            }

            const config = {
                method: 'post',
                url: `${url}/api/login`,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                data,
            };

            const request = await axios.request(config);

            if (request.data.status === 0) {
              await ticket.update({
                user_api_hash: 'email',
              });
              await ticket.reload();
              return request.data.status;
            }

            await ticket.update({
              user_api_hash: `${request.data.user_api_hash}@@@step1`,
            });

            await ticket.reload();

        } catch (err) {
            logger.info("Erro ao logar na sessão do smartgps: ", err)
            await ticket.update({
              user_api_hash: 'email',
            });
            await ticket.reload();
            return 0;
        }
    }

    async function listDevices() {
      try {

          const config = {
              method: 'get',
              url: `${url}/api/get_devices`,
              headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
              },
              params: {
                user_api_hash: ticket?.user_api_hash?.split('@@@')[0],
                lang: 'en',
              },
          };

          const request = await axios.request(config);

          const devices = request.data[0].items;
          return devices

      } catch (err) {
          logger.info("Erro ao listar devices: ", err)
          throw err;
      }
    }

    async function sendCommand(device_id: number, type: string, message = "") {
      try {

        const data = {
          device_id: Number(device_id),
          type,
          message,
        }

        const config = {
            method: 'post',
            url: `${url}/api/send_gprs_command`,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data,
            params: {
              user_api_hash: ticket?.user_api_hash?.split('@@@')[0],
            },
        };

        const request = await axios.request(config);

        return request.data;

      } catch (err) {
          logger.info("Erro ao enviar comando para o dispositivo: ", err)
          throw err;
      }
    }

    async function listCommands() {
      try {

        const config = {
            method: 'get',
            url: `${url}/api/send_command_data`,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            params: {
              user_api_hash: ticket?.user_api_hash?.split('@@@')[0],
            },
        };

        const request = await axios.request(config);

        return request.data;

      } catch (err) {
          logger.info("Erro ao listar os comandos para o dispositivo: ", err)
          throw err;
      }
    }




    try {
      // if (ticket.status === 'closed' && bodyMessage === "1") {

      //   await wbot.sendMessage(msg.key.remoteJid, { text: `Por favor, 🔑 *digite seu login*:\n\n0 - Cancelar` });

      //   await ticket.update({
      //     user_api_hash: 'email',
      //   });
      //   await ticket.reload();

      //   return;
      // }
      // falar com atendente *1* - consultar veiculo
      if (bodyMessage === "1" && !ticket?.user_api_hash) {
        // await sleep(2000)
        await wbot.sendMessage(msg.key.remoteJid, { text: `Por favor,  🔑 *digite seu login*:\n\n0️⃣ - Cancelar` });

        await ticket.update({
          user_api_hash: 'email',
        });
        await ticket.reload();

        return;
      }

      // get email
      if (ticket?.user_api_hash === 'email') {
        // await sleep(2000)
        if (bodyMessage == "0") {
          await UpdateTicketService({
            ticketData: { status: "closed", user_api_hash: null },
            ticketId: ticket.id,
            companyId: ticket.companyId,
          });
          await ticket.reload();
          await wbot.sendMessage(
            msg.key.remoteJid,
            { text:
              '*Atendimento encerrado!'
            }
          );

          return;
        }
        await wbot.sendMessage(msg.key.remoteJid, { text: `Por favor, 🔒 *digite sua senha (atente-se as letras maiusculas se houver)*: \n\n0️⃣ - Cancelar` });

        await ticket.update({
          user_api_hash: `password@@@@${bodyMessage.toLowerCase()}`,
        });
        await ticket.reload();

        return;
      }

      // faz login e manda as opcoes
      if (ticket?.user_api_hash?.split('@@@@')[0] === 'password') {
        if (bodyMessage == "0") {
          // ticket.update({ queueId: null, userId: null, status: 'closed', user_api_hash: null });
          await UpdateTicketService({
            ticketData: { status: "closed", user_api_hash: null },
            ticketId: ticket.id,
            companyId: ticket.companyId,
          });

          await ticket.reload();
          await wbot.sendMessage(
            msg.key.remoteJid,
            { text:
              '*Atendimento encerrado!*'
            }
          );

          return;
        }
        // await sleep(2000)
        // await wbot.sendMessage(msg.key.remoteJid, { text: `Por favor, 🔒 *digite sua senha (atente-se as letras maiusculas se houver)*: ` });
        const passwd = bodyMessage;
        const email = ticket?.user_api_hash?.split('@@@@')[1]
        const stts = await getUserHash(email, passwd)
        if (Number(stts) === 0) {
          await wbot.sendMessage(
            msg.key.remoteJid,
            { text:
             'Erro ao fazer login digite o *login novamente*!'
            }
          );
          return;
        }
        await wbot.sendMessage(
          msg.key.remoteJid,
          { text:
           'Login Realizado com *sucesso*!✨\n\n🚨 *Importante: Se este dispositivo não for seu. finalize suas tarefas e pressione* 8️⃣ *para logout*. Lembre-se de *apagar esta conversa* para manter sua senha segura. 🚨\n\n\n*Escolha sua ação:*\n\n*1* - 🚗💨 *Localizar meu veículo* - Veja onde está seu veículo e seu status atual.\n\n*2* - ⛔️🛢 *Bloquear combustível* - Impede o uso de combustível, aumentando a segurança.\n\n*3* - ✅🛢 *Desbloquear combustível* - Libera o uso de combustível para seu veículo.\n\n8 - 🔒 Logout - Encerra sua sessão de forma segura.\n'
          }
        );
        return;
      }

      // 8 logout
      if (bodyMessage == "8" && ticket?.user_api_hash?.split('@@@')[1] === "step1") {

        // ticket.update({ queueId: null, userId: null, status: 'closed', user_api_hash: null });
        await UpdateTicketService({
          ticketData: { status: "closed", user_api_hash: null },
          ticketId: ticket.id,
          companyId: ticket.companyId,
        });

          await ticket.reload();
          await wbot.sendMessage(
            msg.key.remoteJid,
            { text:
              '*Atendimento encerrado!*'
            }
          );
        return;
      }
      // opcao de localizacao de um veiculo ou de todos
      if (bodyMessage == "1" && ticket?.user_api_hash?.split('@@@')[1] === "step1") {

        await ticket.update({
          user_api_hash: `${ticket?.user_api_hash?.split('@@@')[0]}@@@step1-2`,
        });
        await ticket.reload();
        await wbot.sendMessage(
          msg.key.remoteJid,
          { text:
            '📍 Qual *veículo* você gostaria de ver a *localização* e *status*?\n\n*1* - 🚗🔍 *Ver um veículo específico* - Escolha um veículo para detalhes exclusivos.\n\n*2* - 🚗🚕🚙 *Ver todos os veículos* - Receba informações sobre todos os seus veículos\n\n @ - 🔙 Retornar ao *Menu inicial*. '
          }
        );
        return;
      }
      // escolher veiculo
      if (ticket?.user_api_hash?.split('@@@')[1] === "step1-2") {

        // cancelar operacao
        if (bodyMessage == "@") {
          ticket.update({ user_api_hash: `${ticket?.user_api_hash?.split('@@@')[0]}@@@step1` });

          await ticket.reload();
          await wbot.sendMessage(
            msg.key.remoteJid,
            { text:
              '*Escolha sua ação:*\n\n*1* - 🚗💨 *Localizar meu veículo* - Veja onde está seu veículo e seu status atual.\n\n*2* - ⛔️🛢 *Bloquear combustível* - Impede o uso de combustível, aumentando a segurança.\n\n*3* - ✅🛢 *Desbloquear combustível* - Libera o uso de combustível para seu veículo.\n\n8 - 🔒 Logout - Encerra sua sessão de forma segura.\n'
            }
          );

          return;
        }

        if (bodyMessage === "*") {
          // ticket.update({ queueId: null, userId: null, status: 'closed', user_api_hash: null });
          await UpdateTicketService({
            ticketData: { status: "closed", user_api_hash: null },
            ticketId: ticket.id,
            companyId: ticket.companyId,
          });

          await ticket.reload();
          await wbot.sendMessage(
            msg.key.remoteJid,
            { text:
              '*Atendimento encerrado!*'
            }
          );
          return;
        }

        // ver um veiculo especifico
        if (bodyMessage == "1") {

          const devices = await listDevices()

          let str = 'Selecione o *número* do Veículo para ver detalhes:\n\n'
          devices.map((de: any, index: number) => {
          str = str + `${index + 1} - 🚘 *Nome*: ${de.name}; Placa: ${de.device_data.plate_number}\n\n`
          })
          await wbot.sendMessage(
            msg.key.remoteJid,
            { text: `${str}\n\n\n@ - 🔙 Retornar ao *menu inicial*\n*** - 🔒 Deslogar` }
          );
          await ticket.update({
            user_api_hash: `${ticket?.user_api_hash?.split('@@@')[0]}@@@chosevehicle`,
          });
          await ticket.reload();
          return;
        }
        // ver todos os veiculos
        if (bodyMessage == "2") {
          const devices = await listDevices()
          let str = '*Veiculos abaixo*: \n\n\n'
          devices.map((de: any, index: number) => {
            const objctArr = {
              idx: index + 1,
              id: de.id,
              name: de.name,
              status: de.online,
              speed: de.speed,
              stop_duration: de.stop_duration,
              date: de.time,
              plate: de.device_data.plate_number,
              lat: de.lat,
              lng: de.lng,
              deviceId: de.id,
            }
            str = str + `📍 🗺️ *Veículo*: ${objctArr.name}\n🚦 *Velocidade*: ${objctArr.speed}\n📅 *Data/Hora*: ${objctArr.date}\n⏳ *Parado há*: ${objctArr.stop_duration}\n\n\n*Localização Atual*: https://maps.google.com/maps?q=${objctArr.lat},${objctArr.lng}\n\n\n*Vista da rua*: https://maps.google.com/?layer=c&cbll=${objctArr.lat},${objctArr.lng}\n`
          })

          await wbot.sendMessage(
            msg.key.remoteJid,
            { text: `${str}\n\n\n\n@ - 🔙 Retornar ao *menu inicial*\n*** - 🔒 Deslogar` }
          );
          return;
        }
      }
      // um veiculo selecionado para ver a localizacao
      if (ticket?.user_api_hash?.split('@@@')[1] === "chosevehicle") {

        if (bodyMessage == "@") {
          ticket.update({ user_api_hash: `${ticket?.user_api_hash?.split('@@@')[0]}@@@step1` });

          await ticket.reload();
          await wbot.sendMessage(
            msg.key.remoteJid,
            { text:
              '*Escolha sua ação:*\n\n*1* - 🚗💨 *Localizar meu veículo* - Veja onde está seu veículo e seu status atual.\n\n*2* - ⛔️🛢 *Bloquear combustível* - Impede o uso de combustível, aumentando a segurança.\n\n*3* - ✅🛢 *Desbloquear combustível* - Libera o uso de combustível para seu veículo.\n\n8 - 🔒 Logout - Encerra sua sessão de forma segura.\n'
            }
          );

          return;
        }
        if (bodyMessage === "*") {
          // ticket.update({ queueId: null, userId: null, status: 'closed', user_api_hash: null });
          await UpdateTicketService({
            ticketData: { status: "closed", user_api_hash: null },
            ticketId: ticket.id,
            companyId: ticket.companyId,
          });

          await ticket.reload();
          await wbot.sendMessage(
            msg.key.remoteJid,
            { text:
              '*Atendimento encerrado!*'
            }
          );
          return;
        }


        const devices = await listDevices()
        const devicesMap = []
        devices.map((de: any, index: number) => {
          const objctArr = {
            idx: index + 1,
            id: de.id,
            name: de.name,
            status: de.online,
            speed: de.speed,
            stop_duration: de.stop_duration,
            date: de.time,
            plate: de.device_data.plate_number,
            lat: de.lat,
            lng: de.lng,
          }
          devicesMap.push(objctArr)
        })
        // console.log({
        //   bodyMessage,
        //   devicesMap,
        // })
        if (devicesMap.some(d => d.idx === Number(bodyMessage))) {

          const data = devicesMap.find(d => d.idx === Number(bodyMessage))

          await wbot.sendMessage(
            msg.key.remoteJid,
            { text: `📍 🗺️ *Veículo*: ${data.name}\n🚦 *Velocidade*: ${data.speed}\n📅 *Data/Hora*: ${data.date}\n⏳ *Parado há*: ${data.stop_duration}\n\n\n\n*Localização Atual*: https://maps.google.com/maps?q=${data.lat},${data.lng}\n\n\n*Vista da rua*: https://maps.google.com/?layer=c&cbll=${data.lat},${data.lng}\n\n\n@ - 🔙 Retornar ao *Menu inicial*\n*** - 🔒 Deslogar` }
          );
          return;

        }
      }

      // bloquear combustivel
      if (bodyMessage == "2" && ticket?.user_api_hash?.split('@@@')[1] === "step1") {
        await ticket.update({
          user_api_hash: `${ticket?.user_api_hash?.split('@@@')[0]}@@@step2`,
        });
        await ticket.reload();
        const devices = await listDevices()
        let str = 'Selecione o *número do Veículo* que você gostaria de *bloquear o combustível* : \n\n⚠️ATENÇÃO⚠️\n*Após escolher a opção abaixo seu veículo será bloqueado*.\n\n'
        devices.map((de: any, index: number) => {
        str = str + `*${index + 1}* - 🚗 *Nome*: ${de.name}; *Placa*: ${de.device_data.plate_number}\n\n`
        })
        await wbot.sendMessage(
          msg.key.remoteJid,
          { text:
            `${str}\n\n\n@ - 🔙 Retornar ao *Menu inicial*\n*** - 🔒 Deslogar`
          }
        );
        return;
      }
      // veiculo escolhido processando envio de comando para bloquear
      if (ticket?.user_api_hash?.split('@@@')[1] === "step2") {

        if (bodyMessage == "@") {
          ticket.update({ user_api_hash: `${ticket?.user_api_hash?.split('@@@')[0]}@@@step1` });

          await ticket.reload();
          await wbot.sendMessage(
            msg.key.remoteJid,
            { text:
              '*Escolha sua ação:*\n\n*1* - 🚗💨 *Localizar meu veículo* - Veja onde está seu veículo e seu status atual.\n\n*2* - ⛔️🛢 *Bloquear combustível* - Impede o uso de combustível, aumentando a segurança.\n\n*3* - ✅🛢 *Desbloquear combustível* - Libera o uso de combustível para seu veículo.\n\n8 - 🔒 Logout - Encerra sua sessão de forma segura.\n'
            }
          );

          return;
        }

        if (bodyMessage === "*") {
          // ticket.update({ queueId: null, userId: null, status: 'closed', user_api_hash: null });
          await UpdateTicketService({
            ticketData: { status: "closed", user_api_hash: null },
            ticketId: ticket.id,
            companyId: ticket.companyId,
          });

          await ticket.reload();
          await wbot.sendMessage(
            msg.key.remoteJid,
            { text:
              '*Atendimento encerrado!*'
            }
          );
          return;
        }

        const devices = await listDevices()
        const devicesMap = []
        devices.map((de: any, index: number) => {
          const objctArr = {
            idx: index + 1,
            id: de.id,
            name: de.name,
            status: de.online,
            speed: de.speed,
            stop_duration: de.stop_duration,
            date: de.time,
            plate: de.device_data.plate_number,
            lat: de.lat,
            lng: de.lng,
          }
          devicesMap.push(objctArr)
        })
        if (devicesMap.some(d => d.idx === Number(bodyMessage))) {
          const vehicle = devicesMap.find(d => d.idx === Number(bodyMessage))
          const type = 'engineStop';
          const res = await sendCommand(vehicle.id, type)
          if (res?.error) {
            await wbot.sendMessage(
              msg.key.remoteJid,
              { text: `${res.error[0]}\n\n\n@ - 🔙 Retornar ao *menu inicial*\n*** - 🔒 Deslogar`}
            );
            return;
          }
          await wbot.sendMessage(
            msg.key.remoteJid,
            { text: `*veículo ${vehicle.name} bloqueado*!\n\n\n@ - 🔙 Retornar ao *menu inicial*\n*** - 🔒 Deslogar`}
          );
        }
      }

      // desbloquear combustivel
      if (bodyMessage == "3" && ticket?.user_api_hash?.split('@@@')[1] === "step1") {
        await ticket.update({
          user_api_hash: `${ticket?.user_api_hash?.split('@@@')[0]}@@@step3`,
        });
        await ticket.reload();
        const devices = await listDevices()
        let str = 'Selecione o número do Veículo que você gostaria de *desbloquear o combustível* \n\n\n'
        devices.map((de: any, index: number) => {
        str = str + `${index + 1} - 🚗 *Nome*: ${de.name}; *Placa*: ${de.device_data.plate_number}\n\n`
        })
        await wbot.sendMessage(
          msg.key.remoteJid,
          { text:
            `${str}\n\n\n @ - 🔙 Retornar ao *menu inicial*\n*** - 🔒 Deslogar`
          }
        );
        return;
      }
      // veiculo escolhido processando envio de comando para desbloquear
      if (ticket?.user_api_hash?.split('@@@')[1] === "step3") {

        if (bodyMessage == "@") {
          ticket.update({ user_api_hash: `${ticket?.user_api_hash?.split('@@@')[0]}@@@step1` });

          await ticket.reload();
          await wbot.sendMessage(
            msg.key.remoteJid,
            { text:
              '*Escolha sua ação:*\n\n*1* - 🚗💨 *Localizar meu veículo* - Veja onde está seu veículo e seu status atual.\n\n*2* - ⛔️🛢 *Bloquear combustível* - Impede o uso de combustível, aumentando a segurança.\n\n*3* - ✅🛢 Desbloquear combustível* - Libera o uso de combustível para seu veículo.\n\n8 - 🔒 Logout - Encerra sua sessão de forma segura.\n'
            }
          );

          return;
        }
        if (bodyMessage === "*") {
          // ticket.update({ queueId: null, userId: null, status: 'closed', user_api_hash: null });
          await UpdateTicketService({
            ticketData: { status: "closed", user_api_hash: null },
            ticketId: ticket.id,
            companyId: ticket.companyId,
          });

          await ticket.reload();
          await wbot.sendMessage(
            msg.key.remoteJid,
            { text:
              '*Atendimento encerrado!*'
            }
          );
          return;
        }

        const devices = await listDevices()
        const devicesMap = []
        devices.map((de: any, index: number) => {
          const objctArr = {
            idx: index + 1,
            id: de.id,
            name: de.name,
            status: de.online,
            speed: de.speed,
            stop_duration: de.stop_duration,
            date: de.time,
            plate: de.device_data.plate_number,
            lat: de.lat,
            lng: de.lng,
          }
          devicesMap.push(objctArr)
        })
        if (devicesMap.some(d => d.idx === Number(bodyMessage))) {
          const vehicle = devicesMap.find(d => d.idx === Number(bodyMessage))
          const type = 'engineResume';
          const res = await sendCommand(vehicle.id, type)
          if (res?.error) {
            await wbot.sendMessage(
              msg.key.remoteJid,
              { text: `${res.error[0]}`}
            );
            await ticket.update({
              user_api_hash: `${ticket?.user_api_hash?.split('@@@')[0]}@@@step1`,
            });
            await ticket.reload();
            return;
          }
          await wbot.sendMessage(
            msg.key.remoteJid,
            { text: `*Veículo ${vehicle.name} desbloqueado*!\n\n\n@ - 🔙 Retornar ao *menu inicial*\n*** - 🔒 Deslogar`}
          );
        }
      }

      // *sair* - Desativar alertas dos veículos para esse número
      // if (bodyMessage.toLowerCase() == "sair" && ticket?.user_api_hash?.split('@@@')[1] === "step1") {
      //   await ticket.update({
      //     user_api_hash: `${ticket?.user_api_hash?.split('@@@')[0]}@@@step4`,
      //   });
      //   await ticket.reload();
      //   const devices = await listDevices()
      //   let str = 'Selecione o *número* do Veículo que você gostaria de *desativar o alarme* : \n\n\n\n'
      //   devices.map((de: any, index: number) => {
      //   str = str + `${index + 1} - Nome: ${de.name}; Placa: ${de.device_data.plate_number}\n\n`
      //   })
      //   await wbot.sendMessage(
      //     msg.key.remoteJid,
      //     { text:
      //       `${str}\n\n\n @ - 🔙 Retornar ao *menu inicial*\n*** - 🔒 Deslogar`
      //     }
      //   );
      //   return;
      // }


      // veiculo escolhido para Desativar alertas
      // if (ticket?.user_api_hash?.split('@@@')[1] === "step4") {

      //   if (bodyMessage == "@") {
      //     ticket.update({ user_api_hash: `${ticket?.user_api_hash?.split('@@@')[0]}@@@step1` });

      //     await ticket.reload();
      //     await wbot.sendMessage(
      //       msg.key.remoteJid,
      //       { text:
      //         '*Escolha sua ação:*\n\n*1* - 🚗💨 *Localizar meu veículo* - Veja onde está seu veículo e seu status atual.\n\n*2* - ⛔️🛢 *Bloquear combustível* - Impede o uso de combustível, aumentando a segurança.\n\n*3* - ✅🛢 *Desbloquear combustível* - Libera o uso de combustível para seu veículo.\n\n8 - 🔒 Logout - Encerra sua sessão de forma segura.\n'
      //       }
      //     );

      //     return;
      //   }

      //   if (bodyMessage === "*") {
      //     // ticket.update({ queueId: null, userId: null, status: 'closed', user_api_hash: null });
      //     await UpdateTicketService({
      //       ticketData: { status: "closed", user_api_hash: null },
      //       ticketId: ticket.id,
      //       companyId: ticket.companyId,
      //     });

      //     await ticket.reload();
      //     await wbot.sendMessage(
      //       msg.key.remoteJid,
      //       { text:
      //         '*Atendimento encerrado!*'
      //       }
      //     );
      //     return;
      //   }

      //   const devices = await listDevices()
      //   const devicesMap = []
      //   devices.map((de: any, index: number) => {
      //     const objctArr = {
      //       idx: index + 1,
      //       id: de.id,
      //       name: de.name,
      //       status: de.online,
      //       speed: de.speed,
      //       stop_duration: de.stop_duration,
      //       date: de.time,
      //       plate: de.device_data.plate_number,
      //       lat: de.lat,
      //       lng: de.lng,
      //     }
      //     devicesMap.push(objctArr)
      //   })
      //   if (devicesMap.some(d => d.idx === Number(bodyMessage))) {
      //     const vehicle = devicesMap.find(d => d.idx === Number(bodyMessage))
      //     const type = 'alarmDisarm';
      //     const res = await sendCommand(vehicle.id, type)
      //     if (res?.error) {
      //       await wbot.sendMessage(
      //         msg.key.remoteJid,
      //         { text: `${res.error[0]}\n\n\n@ - 🔙 Retornar ao *menu inicial*\n*** - 🔒 Deslogar`}
      //       );
      //       return;
      //     }
      //     await wbot.sendMessage(
      //       msg.key.remoteJid,
      //       { text: `Alertas pro veículo ${vehicle.name} *desativados*!\n\n\n@ - 🔙 Retornar ao *menu inicial*\n*** - 🔒 Deslogar`}
      //     );
      //   }
      // }


      // *entrar* - Reativar alertas dos veículos para esse número
      // if (bodyMessage.toLowerCase() == "entrar" && ticket?.user_api_hash?.split('@@@')[1] === "step1") {
      //   await ticket.update({
      //     user_api_hash: `${ticket?.user_api_hash?.split('@@@')[0]}@@@step5`,
      //   });
      //   await ticket.reload();
      //   const devices = await listDevices()
      //   let str = 'Selecione o *número do Veículo* que você gostaria de *Ativar o alarme* : \n\n\n\n'
      //   devices.map((de: any, index: number) => {
      //   str = str + `${index + 1} - Nome: ${de.name}; Placa: ${de.device_data.plate_number}\n\n`
      //   })
      //   await wbot.sendMessage(
      //     msg.key.remoteJid,
      //     { text:
      //       `${str}\n\n\n@ - 🔙 Retornar ao *menu inicial*\n*** - 🔒 Deslogar`
      //     }
      //   );
      //   return;
      // }




      // veiculo escolhido para ativar alertas
      // if (ticket?.user_api_hash?.split('@@@')[1] === "step5") {

      //   if (bodyMessage == "@") {
      //     ticket.update({ user_api_hash: `${ticket?.user_api_hash?.split('@@@')[0]}@@@step1` });

      //     await ticket.reload();
      //     await wbot.sendMessage(
      //       msg.key.remoteJid,
      //       { text:
      //         '*Escolha sua ação:*\n\n*1* - 🚗💨 *Localizar meu veículo* - Veja onde está seu veículo e seu status atual.\n\n*2* - ⛔️🛢 *Bloquear combustível* - Impede o uso de combustível, aumentando a segurança.\n\n*3* - ✅🛢 *Desbloquear combustível* - Libera o uso de combustível para seu veículo.\n\n8 - 🔒 Logout - Encerra sua sessão de forma segura.\n'
      //       }
      //     );

      //     return;
      //   }
      //   if (bodyMessage === "*") {
      //     // ticket.update({ queueId: null, userId: null, status: 'closed', user_api_hash: null });
      //     await UpdateTicketService({
      //       ticketData: { status: "closed", user_api_hash: null },
      //       ticketId: ticket.id,
      //       companyId: ticket.companyId,
      //     });

      //     await ticket.reload();
      //     await wbot.sendMessage(
      //       msg.key.remoteJid,
      //       { text:
      //         '*Atendimento encerrado!*'
      //       }
      //     );
      //     return;
      //   }

      //   const devices = await listDevices()
      //   const devicesMap = []
      //   devices.map((de: any, index: number) => {
      //     const objctArr = {
      //       idx: index + 1,
      //       id: de.id,
      //       name: de.name,
      //       status: de.online,
      //       speed: de.speed,
      //       stop_duration: de.stop_duration,
      //       date: de.time,
      //       plate: de.device_data.plate_number,
      //       lat: de.lat,
      //       lng: de.lng,
      //     }
      //     devicesMap.push(objctArr)
      //   })
      //   if (devicesMap.some(d => d.idx === Number(bodyMessage))) {
      //     const vehicle = devicesMap.find(d => d.idx === Number(bodyMessage))
      //     const type = 'alarmArm';
      //     const res = await sendCommand(vehicle.id, type)
      //     if (res?.error) {
      //       await wbot.sendMessage(
      //         msg.key.remoteJid,
      //         { text: `${res.error[0]}\n\n\n@ - 🔙 Retornar ao *menu inicial*\n*** - 🔒 Deslogar`}
      //       );
      //       return;
      //     }
      //     await wbot.sendMessage(
      //       msg.key.remoteJid,
      //       { text: `Alertas pro veículo ${vehicle.name} *ativados*!\n\n\n@ - 🔙 Retornar ao *menu inicial*\n*** - Deslogar`}
      //     );

      //   }
      // }

      // voltar ao menu principal *
      if (bodyMessage === '@') {

        ticket.update({ user_api_hash: `${ticket?.user_api_hash?.split('@@@')[0]}@@@step1` });

        await ticket.reload();
        await wbot.sendMessage(
          msg.key.remoteJid,
          { text:
           '*1* - 🚗💨 *Localizar meu veículo* - Veja onde está seu veículo e seu status atual.\n\n*2* - ⛔️🛢 *Bloquear combustível* - Impede o uso de combustível, aumentando a segurança.\n\n*3* - ✅🛢 Desbloquear combustível* - Libera o uso de combustível para seu veículo.\n\n8 - 🔒 Logout - Encerra sua sessão de forma segura.\n'
          }
        );
        return;
      }

    } catch (error) {
        logger.info("Error on smartGpsListener: ", error);
        throw error;
    }
}

export default smartGpsListener;
