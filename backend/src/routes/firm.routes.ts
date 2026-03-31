import { Router } from "express";
import { authorize } from "../middleware/authorize";
import { userRole } from "../models/enums";
import * as firmController from "../controllers/firm.controller";

const router = Router();

router.get("/me", firmController.getFirm);
router.put("/me", authorize(userRole.ADMIN), firmController.updateFirm);

export default router;
