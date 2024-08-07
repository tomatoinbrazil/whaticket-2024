import { Chat, Contact } from "@whiskeysockets/baileys";
import Baileys from "../../models/Baileys";
import { isArray } from "lodash";

interface Request {
  whatsappId: number;
  contacts?: Contact[];
  chats?: Chat[];
}

/**
 * Divide um array grande em vários subarrays com um limite máximo de itens.
 * @param data Array original que será dividido.
 * @param maxItems Número máximo de itens por subarray.
 * @returns Array de subarrays, cada um contendo até 'maxItems' itens.
 */
function chunkArray<T>(data: T[], maxItems: number): T[][] {
  const result = [];
  for (let i = 0; i < data.length; i += maxItems) {
    result.push(data.slice(i, i + maxItems));
  }
  return result;
}

const createOrUpdateBaileysService = async ({
  whatsappId,
  contacts,
  chats
}: Request): Promise<Baileys> => {
  const baileysExists = await Baileys.findOne({
    where: { whatsappId }
  });

  if (baileysExists) {
    let getChats = baileysExists.chats
      ? JSON.parse(baileysExists.chats)
      : [];
    let getContacts = baileysExists.contacts
      ? JSON.parse(baileysExists.contacts)
      : [];

    if (chats && isArray(getChats)) {
      getChats.push(...chats);
      getChats.sort();
      getChats = [...new Set(getChats)]; // Remover duplicatas
    }

    if (contacts && isArray(getContacts)) {
      getContacts.push(...contacts);
      getContacts.sort();
      getContacts = [...new Set(getContacts)]; // Remover duplicatas
    }

    // Dividir em chunks e atualizar
    const chunkedChats = chunkArray(getChats, 1000);
    const chunkedContacts = chunkArray(getContacts, 1000);

    for (const chatChunk of chunkedChats) {
      const chatsAsString = JSON.stringify(chatChunk);
      await baileysExists.update({ chats: chatsAsString });
    }

    for (const contactChunk of chunkedContacts) {
      const contactsAsString = JSON.stringify(contactChunk);
      await baileysExists.update({ contacts: contactsAsString });
    }

    return baileysExists;
  }

  // Criação de novo registro se não existir
  const chatsAsString = JSON.stringify(chats);
  const contactsAsString = JSON.stringify(contacts);
  const newBaileys = await Baileys.create({
    whatsappId,
    contacts: contactsAsString,
    chats: chatsAsString
  });

  return newBaileys;
};

export default createOrUpdateBaileysService;
