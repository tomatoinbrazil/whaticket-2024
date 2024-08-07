import Integration from "../../models/Integration";
import AppError from "../../errors/AppError";

const DeleteIntegrationService = async (id: string): Promise<void> => {
  const record = await Integration.findOne({
    where: { id }
  });

  if (!record) {
    throw new AppError("ERR_NO_QUICKMESSAGE_FOUND", 404);
  }

  await record.destroy();
};

export default DeleteIntegrationService;
