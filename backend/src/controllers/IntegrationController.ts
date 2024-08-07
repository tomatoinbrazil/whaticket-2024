import { Request, Response } from "express";
import { ParsedQs } from 'qs';
import CreateIntegrationService from "../services/IntegrationService/CreateIntegrationService";
import ListIntegrationService from "../services/IntegrationService/ListIntegrationService";
import UpdateIntegrationService from "../services/IntegrationService/UpdateIntegrationService";
import DeleteIntegrationService from "../services/IntegrationService/DeleteIntegrationService";
import ShowIntegrationService from "../services/IntegrationService/ShowIntegrationService";
import AsaasOverdueService from "../services/IntegrationService/AsaasOverdueService";
import SGAOverdueService from "../services/IntegrationService/SGAOverdueService";

interface IntegrationData {
    token: string;
    nameToken: string;
    envioAnt: string;
    envioAposVenc: string;
    msgAntVenc?: string;
    msgVenc?: string;
    msgAposVenc?: string;
    msg3AposVenc?: string;
    maxAposVenc?: string;
    incAposVenc?: string;
    envDiaVenc?: boolean;
    name?: string;
    hora?: string
    whatsappId: string;
    companyId?: string;
}

interface QueryParams {
    session?: number | string;
}



export const index = async (req: Request, res: Response): Promise<Response> => {

    const { companyId } = req.user;
    const name = req.query.name as string;
    if (name === undefined) {
        return
    }
    const integration = await ListIntegrationService({ companyId, name });

    return res.status(200).json(integration);
};

export const asaas = async (req: Request, res: Response): Promise<Response> => {
    const { companyId } = req.user;
    const integration = await AsaasOverdueService(companyId);

    return res.status(200).json(integration);
};

export const sga = async (req: Request, res: Response): Promise<Response> => {
    const { companyId } = req.user;
    const integration = await SGAOverdueService(companyId);

    return res.status(200).json(integration);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
    let {
        token,
        nameToken,
        hora,
        envioAnt,
        envioAposVenc,
        maxAposVenc,
        envDiaVenc,
        msgAntVenc,
        incAposVenc,
        msgVenc,
        msg3AposVenc,
        msgAposVenc,
        name,
        whatsappId,
    }: IntegrationData = req.body;
    const { companyId } = req.user;

    if (maxAposVenc === undefined) {
        maxAposVenc = '0'
    }

    const { integration } = await CreateIntegrationService({
        token,
        nameToken,
        hora,
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
        companyId,
    });

    return res.status(200).json(integration);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
    const { integrationId } = req.params;
    const { companyId } = req.user;
    const { session } = req.query;

    const integration = await ShowIntegrationService(integrationId);

    return res.status(200).json(integration);
};

export const update = async (
    req: Request,
    res: Response
): Promise<Response> => {
    const { integrationId } = req.params;
    const integrationData = req.body;
    const { companyId } = req.user;

    const { integration } = await UpdateIntegrationService({
        integrationData,
        integrationId,
        companyId,
    });

    return res.status(200).json(integration);
};

export const remove = async (
    req: Request,
    res: Response
): Promise<Response> => {
    const { integrationId } = req.params;
    const { companyId } = req.user;

    await DeleteIntegrationService(integrationId);

    return res.status(200).json({ message: "removido" });
};
