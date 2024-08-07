import Integration from "../../models/Integration";
import AppError from "../../errors/AppError";
import { FindOptions } from "sequelize/types";

var axios = require("axios").default;
let names: {
  id: string;
  name: string;
  dueDate: string;
  netValue: string;
  mobilePhone: string;
  invoiceUrl: string;
  invoiceNumber: string;
}[] = [];

interface Request {
  companyId: number;
}

const AsaasOverdueService = async (companyId: string | number) => {
  const options1: FindOptions = {
    where: {
      companyId,
      name: "asaas",
    },
  };

  const integration = await Integration.findAll(options1);
  let token = integration[0]?.token;

  async function getCustomer(customer) {
    let config1 = {
      method: "get",
      maxBodyLength: Infinity,
      url: "https://api.asaas.com/v3/customers/" + customer["customer"],
      params: { limit: "100" },
      headers: {
        "Content-Type": "application/json",
        access_token: token,
      },
    };
    try {
      const response1 = await axios.request(config1);
      names.push({
        id: customer["id"],
        name: response1.data["name"],
        dueDate: customer["dueDate"],
        netValue: customer["value"],
        mobilePhone: response1.data["mobilePhone"],
        invoiceUrl: customer["invoiceUrl"],
        invoiceNumber: customer["invoiceNumber"],
      });
    } catch (error) {
      //console.log(error);
    }
  }

  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: "https://api.asaas.com/v3/payments",
    params: { "": "", status: "OVERDUE", limit: "100" },
    headers: {
      "Content-Type": "application/json",
      access_token: token,
    },
  };

  try {
    const response = await axios.request(config);
    let offset = 0;
    let totalCount = response.data["totalCount"];
    let pages = Math.floor(totalCount / 100);
    for (let i = 0; i <= pages; i++) {
      let config1 = {
        method: "get",
        maxBodyLength: Infinity,
        url: "https://api.asaas.com/v3/payments",
        params: {
          status: "OVERDUE", limit: "100", offset: `${offset}`
        },
        headers: {
          "Content-Type": "application/json",
          access_token: token,
        },
      };
      let response1 = await axios.request(config1);
      response1.data["data"].map((item, index) => {
        setTimeout(() => {
          getCustomer(item);
        }, 2000 * index);
      });

      offset = offset + 100;
    }

    let unique = [...new Map(names.map((m) => [m.id, m])).values()];

    while (names.length > 0) {
      names.pop();
    }
    return unique;
  } catch (error) {
    return error.code;
    console.log(error);
  }
};

export default AsaasOverdueService;
