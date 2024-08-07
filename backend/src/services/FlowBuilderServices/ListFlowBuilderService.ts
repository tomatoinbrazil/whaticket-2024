import { Op } from "sequelize";
import FlowBuilder from "../../models/FlowBuilder";

interface Request {
  companyId: number;
}

interface Response {
  flows: any;
}

const ListFlowBuilderService = async ({
  companyId
}: Request): Promise<Response> => {
  const whereCondition = {
    companyId: {
      [Op.eq]: companyId
    }
  };

  const { rows } = await FlowBuilder.findAndCountAll({
    where: whereCondition,
    attributes: ["title", "id"],
    order: [["createdAt", "DESC"]],
  });

  return { flows: rows };
};

export default ListFlowBuilderService;
