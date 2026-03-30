import { Router } from "express";

const router = Router();

// Health check endpoint (no auth required)
router.get("/health", (_req, res) => {
  res.json({ data: { status: "ok" } });
});

// TODO: Mount module routes here as they are built
// Example:
// router.use("/cases", authMiddleware, tenantMiddleware, caseRoutes);
// router.use("/matters", authMiddleware, tenantMiddleware, matterRoutes);
// router.use("/persons", authMiddleware, tenantMiddleware, personRoutes);
// router.use("/events", authMiddleware, tenantMiddleware, eventRoutes);

export default router;
