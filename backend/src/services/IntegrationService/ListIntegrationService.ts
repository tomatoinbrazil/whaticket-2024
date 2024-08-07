import { FindOptions } from "sequelize/types";
import Integration from "../../models/Integration";
var axios = require("axios").default;

interface Request {
  name: any;
  companyId: number;
}

const ListIntegrationService = async ({
  name,
  companyId
}: Request): Promise<Integration[]> => {
  const options: FindOptions = {
    where: {
      name: name as string,
      companyId
    },

  };


  const integration = await Integration.findAll(options);

  return integration;
}; 

export default ListIntegrationService;
