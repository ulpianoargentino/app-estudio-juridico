import { Router } from "express";
import * as aiController from "../controllers/ai.controller";

const router = Router();

router.post("/chat", aiController.chat);

export default router;
