import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import { removeWbot, restartWbot } from "../libs/wbot";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";

import { getAccessTokenFromPage, getPageProfile, subscribeApp } from "../services/FacebookServices/graphAPI";

import CreateWhatsAppService from "../services/WhatsappService/CreateWhatsAppService";
import DeleteWhatsAppService from "../services/WhatsappService/DeleteWhatsAppService";
import ListWhatsAppsService from "../services/WhatsappService/ListWhatsAppsService";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import UpdateWhatsAppService from "../services/WhatsappService/UpdateWhatsAppService";
import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";

interface WhatsappData {
  name: string;
  queueIds: number[];
  companyId: number;
  greetingMessage?: string;
  complationMessage?: string;
  outOfHoursMessage?: string;
  ratingMessage?: string;
  status?: string;
  isDefault?: boolean;
  enablePowerCrm?: boolean;
  token?: string;
  sendIdQueue?: number;
  timeSendQueue?: number;
  promptId?: number;
  flowId?: number;
  maxUseBotQueues?: number;
  timeUseBotQueues?: number;
  expiresTicket?: number;
  expiresInactiveMessage?: string;
}

interface QueryParams {
  session?: number | string;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { session } = req.query as QueryParams;
  const whatsapps = await ListWhatsAppsService({ companyId, session });

  return res.status(200).json(whatsapps);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const {
    name,
    status,
    isDefault,
    enablePowerCrm,
    greetingMessage,
    complationMessage,
    outOfHoursMessage,
    queueIds,
    token,
    timeSendQueue,
    sendIdQueue,
    promptId,
    flowId,
    maxUseBotQueues,
    timeUseBotQueues,
    expiresTicket,
    expiresInactiveMessage
  }: WhatsappData = req.body;
  const { companyId } = req.user;

  const { whatsapp, oldDefaultWhatsapp } = await CreateWhatsAppService({
    name,
    status,
    isDefault,
    enablePowerCrm,
    greetingMessage,
    complationMessage,
    outOfHoursMessage,
    queueIds,
    companyId,
    token,
    timeSendQueue,
    sendIdQueue,
    promptId,
    flowId,
    maxUseBotQueues,
    timeUseBotQueues,
    expiresTicket,
    expiresInactiveMessage
  });

  StartWhatsAppSession(whatsapp, companyId);

  const io = getIO();
  io.emit(`company-${companyId}-whatsapp`, {
    action: "update",
    whatsapp
  });

  if (oldDefaultWhatsapp) {
    io.emit(`company-${companyId}-whatsapp`, {
      action: "update",
      whatsapp: oldDefaultWhatsapp
    });
  }

  return res.status(200).json(whatsapp);
};

export const storeFacebook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const {
      facebookUserId,
      facebookUserToken,
      addInstagram
    }: {
      facebookUserId: string;
      facebookUserToken: string;
      addInstagram: boolean;
    } = req.body;
    const { companyId } = req.user;

    // const company = await ShowCompanyService(companyId)
    // const plan = await ShowPlanService(company.planId);

    // if (!plan.useFacebook) {
    //   return res.status(400).json({
    //     error: "Você não possui permissão para acessar este recurso!"
    //   });
    // }

    const { data } = await getPageProfile(facebookUserId, facebookUserToken);


    /* if (data.length === 0) {
      return res.status(400).json({
        error: "Facebook page not found1"
      });
    } */
    const io = getIO();

    const pages = [];
    for await (const page of data) {
      const { name, access_token, id, instagram_business_account } = page;

      const acessTokenPage = await getAccessTokenFromPage(access_token);

      pages.push({
        companyId,
        name,
        facebookUserId: facebookUserId,
        facebookPageUserId: id,
        facebookUserToken: acessTokenPage,
        tokenMeta: facebookUserToken,
        isDefault: false,
        channel: "facebook",
        status: "CONNECTED",
        greetingMessage: "",
        farewellMessage: "",
        queueIds: [],
        isMultidevice: false
      });

      await subscribeApp(page.id, acessTokenPage);


    }

    for await (const pageConection of pages) {

      const exist = await Whatsapp.findOne({
        where: {
          facebookPageUserId: pageConection.facebookPageUserId
        }
      });

      if (exist) {
        await exist.update({
          ...pageConection
        });
      }

      if (!exist) {
        const { whatsapp } = await CreateWhatsAppService(pageConection);

        io.emit(`company-${companyId}-whatsapp`, {
          action: "update",
          whatsapp
        });

      }
    }
    return res.status(200);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: "Facebook page not found2"
    });
  }
};

export const storeInstagram = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const {
      facebookUserId,
      facebookUserToken,
      addInstagram
    }: {
      facebookUserId: string;
      facebookUserToken: string;
      addInstagram: boolean;
    } = req.body;
    const { companyId } = req.user;

    // const company = await ShowCompanyService(companyId)
    // const plan = await ShowPlanService(company.planId);

    // if (!plan.useFacebook) {
    //   return res.status(400).json({
    //     error: "Você não possui permissão para acessar este recurso!"
    //   });
    // }

    const { data } = await getPageProfile(facebookUserId, facebookUserToken);

    /* if (data.length === 0) {
      return res.status(400).json({
        error: "Facebook page not found1"
      });
    } */
    const io = getIO();

    const pages = [];
    for await (const page of data) {
      const { name, access_token, id, instagram_business_account } = page;

      const acessTokenPage = await getAccessTokenFromPage(access_token);

      // if (instagram_business_account && addInstagram) {
      const { id: instagramId, username, name: instagramName } = instagram_business_account;

      pages.push({
        companyId,
        name: `Insta ${username || instagramName}`,
        facebookUserId: facebookUserId,
        facebookPageUserId: instagramId,
        facebookUserToken: acessTokenPage,
        tokenMeta: facebookUserToken,
        isDefault: false,
        channel: "instagram",
        status: "CONNECTED",
        greetingMessage: "",
        farewellMessage: "",
        queueIds: [],
        isMultidevice: false
      });

      await subscribeApp(id, acessTokenPage);
      //}
    }

    for await (const pageConection of pages) {

      const exist = await Whatsapp.findOne({
        where: {
          facebookPageUserId: pageConection.facebookPageUserId
        }
      });

      if (exist) {
        await exist.update({
          ...pageConection
        });
      }

      if (!exist) {
        const { whatsapp } = await CreateWhatsAppService(pageConection);

        io.emit(`company-${companyId}-whatsapp`, {
          action: "update",
          whatsapp
        });

      }
    }
    return res.status(200);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: "Facebook page not found2"
    });
  }
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;
  const { session } = req.query;

  const whatsapp = await ShowWhatsAppService(whatsappId, companyId, session);

  return res.status(200).json(whatsapp);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;
  const whatsappData = req.body;
  const { companyId } = req.user;

  const { whatsapp, oldDefaultWhatsapp } = await UpdateWhatsAppService({
    whatsappData,
    whatsappId,
    companyId
  });

  const io = getIO();
  io.emit(`company-${companyId}-whatsapp`, {
    action: "update",
    whatsapp
  });

  if (oldDefaultWhatsapp) {
    io.emit(`company-${companyId}-whatsapp`, {
      action: "update",
      whatsapp: oldDefaultWhatsapp
    });
  }

  return res.status(200).json(whatsapp);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;
  const io = getIO();
  const whatsapp = await ShowWhatsAppService(whatsappId, companyId);

  if (whatsapp.channel === "whatsapp") {
    await DeleteWhatsAppService(whatsappId);
    removeWbot(+whatsappId);

    io.emit(`company-${companyId}-whatsapp`, {
      action: "delete",
      whatsappId: +whatsappId
    });

  }

  if (whatsapp.channel === "facebook" || whatsapp.channel === "instagram") {
    const { facebookUserToken } = whatsapp;

    const getAllSameToken = await Whatsapp.findAll({
      where: {
        facebookUserToken
      }
    });

    await Whatsapp.destroy({
      where: {
        facebookUserToken
      }
    });

    for await (const whatsapp of getAllSameToken) {
      io.emit(`company-${companyId}-whatsapp`, {
        action: "delete",
        whatsappId: whatsapp.id
      });
    }

  }

  return res.status(200).json({ message: "Session disconnected." });
};

export const restart = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId, profile } = req.user;

  if (profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  await restartWbot(companyId);

  return res.status(200).json({ message: "Whatsapp restart." });
};
