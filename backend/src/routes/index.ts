import { Router } from "express";

const router = Router();

// Health check — no auth required
router.get("/health", (_req, res) => {
  res.json({ data: { status: "ok" } });
});

// Module routes will be mounted here as they are built:
// router.use("/cases", casesRouter);
// router.use("/matters", mattersRouter);
// router.use("/persons", personsRouter);
// router.use("/events", eventsRouter);
// router.use("/documents", documentsRouter);

export default router;
