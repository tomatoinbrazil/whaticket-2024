import { Request, Response } from "express";

import CreateFlowBuilderService from "../services/FlowBuilderServices/CreateFlowBuilderService";
import UpdateFlowBuilderService from "../services/FlowBuilderServices/UpdateFlowBuilderService";
import ListFlowBuilderService from "../services/FlowBuilderServices/ListFlowBuilderService";
import ListByIdFlowBuilderService from "../services/FlowBuilderServices/ListByIdFlowBuilderService";


export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;

  const { flows } = await ListFlowBuilderService({
    companyId,
  });

  return res.json({ flows });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const {
    title,
    edges,
    nodes,
    companyId,
  } = req.body;
  let userCompanyId: number | null = null;

  if (req.user !== undefined) {
    const { companyId: cId } = req.user;
    userCompanyId = cId;
    console.log({cId})
  }
  const createFlow = await CreateFlowBuilderService({
    title,
    edges,
    nodes,
    companyId,
  });

  return res.status(200).json({flow: createFlow});
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const {
    id,
    title,
    edges,
    nodes,
    companyId,
  } = req.body;
  let userCompanyId: number | null = null;

  if (req.user !== undefined) {
    const { companyId: cId } = req.user;
    userCompanyId = cId;
  }
  const updateFlow = await UpdateFlowBuilderService({
    id,
    title,
    edges,
    nodes,
    companyId,
  });

  return res.status(200).json({flow: updateFlow});
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.query
  console.log({idQuery: id})

  const flow = await ListByIdFlowBuilderService({id: Number(id)});

  return res.status(200).json({flow});
};
