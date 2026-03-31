import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";

const router = Router();

// GET /api/notifications/count must be before /:id
router.get("/count", notificationController.countUnread);

// PATCH /api/notifications/read-all must be before /:id
router.patch("/read-all", notificationController.markAllAsRead);

router.get("/", notificationController.list);
router.patch("/:id/read", notificationController.markAsRead);

export default router;
