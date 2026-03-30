import { Router } from "express";
import * as caseController from "../controllers/case.controller";

const router = Router();

// GET /api/cases/summary must be before /:id
router.get("/summary", caseController.summary);

router.get("/", caseController.list);
router.get("/:id", caseController.getById);
router.post("/", caseController.create);
router.put("/:id", caseController.update);
router.delete("/:id", caseController.remove);

export default router;
