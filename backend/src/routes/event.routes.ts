import { Router } from "express";
import * as eventController from "../controllers/event.controller";

const router = Router();

// /api/events/upcoming must be before /:id
router.get("/upcoming", eventController.upcoming);

router.get("/", eventController.list);
router.post("/", eventController.create);
router.put("/:id", eventController.update);
router.patch("/:id/complete", eventController.complete);
router.delete("/:id", eventController.remove);

export default router;
