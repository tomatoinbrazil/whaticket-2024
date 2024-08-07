import * as Yup from "yup";
import { Op } from "sequelize";

import AppError from "../../errors/AppError";
import Integration from "../../models/Integration";


interface integrationData {
  hora?: string;
  token: string;
  nameToken: string;
  envioAnt?: string;
  envioAposVenc?: string;
  maxAposVenc?: string;
  incAposVenc?: string;
  envDiaVenc?: boolean;
  msgAntVenc?: string;
  msgVenc?: string;
  name: string;
  whatsappId: string;
  msgAposVenc?: string;
  msg3AposVenc?: string;
  companyId: number;
}

interface Request {
  integrationData: integrationData;
  integrationId: string;
  companyId: number;
}

interface Response {
  integration: Integration;
}

const UpdateIntegrationService = async ({
  integrationData,
  integrationId,
  companyId
}: Request): Promise<Response> => {

  const {
    hora,
    token,
    nameToken,
    envioAnt,
    envioAposVenc,
    maxAposVenc,
    incAposVenc,
    envDiaVenc,
    msgAntVenc,
    msgVenc,
    msgAposVenc,
    msg3AposVenc,
    name,
    whatsappId,
  } = integrationData;

  try {

  } catch (err: any) {
    throw new AppError(err.message);
  }




  const integration = await Integration.findByPk(integrationId);

  await integration.update({
    hora,
    token,
    nameToken,
    envioAnt,
    envioAposVenc,
    maxAposVenc,
    envDiaVenc,
    msgAntVenc,
    incAposVenc,
    msgVenc,
    msgAposVenc,
    msg3AposVenc,
    name,
    whatsappId,
    companyId
  });


  return { integration };
};

export default UpdateIntegrationService;
