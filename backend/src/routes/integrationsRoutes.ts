import express from "express";
import isAuth from "../middleware/isAuth";

import * as IntegrationController from "../controllers/IntegrationController";

const integrationsRoutes = express.Router();

integrationsRoutes.get("/integration/", isAuth, IntegrationController.index);
integrationsRoutes.get("/integration/asaas", isAuth, IntegrationController.asaas);
integrationsRoutes.get("/integration/sga", isAuth, IntegrationController.sga);
integrationsRoutes.post("/integration/", isAuth, IntegrationController.store);
integrationsRoutes.get("/integration/:integrationId", isAuth, IntegrationController.show);
integrationsRoutes.put("/integration/:integrationId", isAuth, IntegrationController.update);
integrationsRoutes.delete("/integration/:integrationId", isAuth, IntegrationController.remove);

export default integrationsRoutes;
