import * as Yup from "yup";

import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import { Integrations } from "@sentry/node";
import Integration from "../../models/Integration";
interface Request {
  hora?: string;
  token: string;
  nameToken: string;
  envioAnt?: string;
  envioAposVenc?: string;
  maxAposVenc?: string;
  incAposVenc?: any;
  envDiaVenc?: boolean;
  msgAntVenc?: string;
  msgVenc?: string;
  name: string;
  whatsappId: string;
  msgAposVenc?: string;
  msg3AposVenc?: string;
  companyId: number;
}


interface Response {
  integration: Integration;
}

const CreateIntegrationService = async ({
  hora,
  nameToken,
  token,
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
  companyId,

}: Request): Promise<Response> => {

  const IntegrationFound = await Integration.findOne({ where: { name: name } })
    .then(name => name !== null)
    .then(isUnique => isUnique);


  if (IntegrationFound === false) {
    const integration = await Integration.create({
      hora,
      token,
      nameToken,
      envioAnt,
      envioAposVenc,
      maxAposVenc,
      incAposVenc: incAposVenc | 0,
      envDiaVenc,
      msgAntVenc,
      msgVenc,
      msgAposVenc,
      msg3AposVenc,
      name,
      whatsappId,
      companyId,
    });

    return { integration };
  } else {

    const integration = await Integration.create({
      hora,
      token,
      nameToken,
      envioAnt,
      envioAposVenc,
      incAposVenc: incAposVenc | 0,
      maxAposVenc,
      envDiaVenc,
      msgAntVenc,
      msgVenc,
      msgAposVenc,
      msg3AposVenc,
      name,
      whatsappId,
      companyId,
    });

    return { integration };
  }



};

export default CreateIntegrationService;
