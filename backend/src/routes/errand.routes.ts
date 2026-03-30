import { Router } from "express";
import * as errandController from "../controllers/errand.controller";

const router = Router();

// Standalone routes for update/delete (mounted at /api/errands)
router.put("/:id", errandController.update);
router.delete("/:id", errandController.remove);

export default router;
