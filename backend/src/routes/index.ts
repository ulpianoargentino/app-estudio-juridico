import { Router } from "express";
import authRoutes from "./auth.routes";
import personRoutes from "./person.routes";
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
router.use("/persons", authMiddleware, firmContextMiddleware, personRoutes);

export default router;
