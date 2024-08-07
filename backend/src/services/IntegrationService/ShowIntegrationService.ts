import Integration from "../../models/Integration";
import AppError from "../../errors/AppError";

const ShowIntegrationService = async (id: string | number): Promise<Integration> => {
  const record = await Integration.findByPk(id);

  if (!record) {
    throw new AppError("ERR_NO_TICKETNOTE_FOUND", 404);
  }

  return record;
};

export default ShowIntegrationService;
