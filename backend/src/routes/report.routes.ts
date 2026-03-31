import { Router } from "express";
import * as reportController from "../controllers/report.controller";

const router = Router();

router.get("/cases", reportController.casesReport);
router.get("/cases/export", reportController.casesExport);
router.get("/deadlines", reportController.deadlinesReport);
router.get("/errands", reportController.errandsReport);

export default router;
