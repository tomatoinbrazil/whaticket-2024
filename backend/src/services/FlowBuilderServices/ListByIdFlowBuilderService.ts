import { Op } from "sequelize";
import FlowBuilder from "../../models/FlowBuilder";

interface Request {
  id: number;
}

interface Response {
  flows: any;
}

const ListByIdFlowBuilderService = async ({
  id,
}: Request): Promise<any> => {


  const data = await FlowBuilder.findByPk(id);

  return data;
};

export default ListByIdFlowBuilderService;
