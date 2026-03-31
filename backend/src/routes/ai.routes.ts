import { Router } from "express";
import * as aiController from "../controllers/ai.controller";

const router = Router();

router.post("/chat", aiController.chat);
router.post("/generate-filing", aiController.generateFilingHandler);
router.post("/suggest-next-steps", aiController.suggestNextStepsHandler);
router.post("/analyze-document", aiController.analyzeDocumentHandler);

export default router;
