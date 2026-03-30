import { Router } from "express";
import * as movementController from "../controllers/movement.controller";

const router = Router();

// Standalone routes for update/delete (mounted at /api/movements)
router.put("/:id", movementController.update);
router.delete("/:id", movementController.remove);

export default router;
