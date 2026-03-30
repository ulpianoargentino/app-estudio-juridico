import { Router } from "express";
import authRoutes from "./auth.routes";

const router = Router();

// Health check (no auth required)
router.get("/health", (_req, res) => {
  res.json({ data: { status: "ok" } });
});

// Auth routes (register/login are public, me requires auth)
router.use("/auth", authRoutes);

// TODO: Mount module routes here as they are built
// router.use("/cases", authMiddleware, firmContextMiddleware, caseRoutes);
// router.use("/matters", authMiddleware, firmContextMiddleware, matterRoutes);

export default router;
