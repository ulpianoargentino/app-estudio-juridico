import { Router } from "express";
import authRoutes from "./auth.routes";
import personRoutes from "./person.routes";
import courtRoutes from "./court.routes";
import caseRoutes from "./case.routes";
import matterRoutes from "./matter.routes";
import movementRoutes from "./movement.routes";
import errandRoutes from "./errand.routes";
import eventRoutes from "./event.routes";
import { authMiddleware } from "../middleware/auth";
import { firmContextMiddleware } from "../middleware/firm-context";

const router = Router();

// Health check (no auth required)
router.get("/health", (_req, res) => {
  res.json({ data: { status: "ok" } });
});

// Auth routes (register/login are public, me requires auth)
router.use("/auth", authRoutes);

// Protected routes — auth + firm context
const protect = [authMiddleware, firmContextMiddleware];
router.use("/persons", ...protect, personRoutes);
router.use("/courts", ...protect, courtRoutes);
router.use("/cases", ...protect, caseRoutes);
router.use("/matters", ...protect, matterRoutes);
router.use("/movements", ...protect, movementRoutes);
router.use("/errands", ...protect, errandRoutes);
router.use("/events", ...protect, eventRoutes);

export default router;
