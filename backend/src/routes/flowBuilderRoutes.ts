import { Router } from "express";
import * as FlowController from "../controllers/FlowBuilderController";
import isAuth from "../middleware/isAuth";

const authRoutes = Router();

authRoutes.post("/flowbuilder", isAuth, FlowController.store);
authRoutes.put("/flowbuilder", isAuth, FlowController.update);
authRoutes.get("/flowbuilder", isAuth, FlowController.index);
authRoutes.get("/flowbuilder/find", isAuth, FlowController.show);

export default authRoutes;
