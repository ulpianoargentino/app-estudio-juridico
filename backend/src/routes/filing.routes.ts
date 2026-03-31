import { Router } from "express";
import * as filingController from "../controllers/filing.controller";

const router = Router();

router.post("/generate-pdf", filingController.generatePdf);
router.post("/save", filingController.save);

export default router;
