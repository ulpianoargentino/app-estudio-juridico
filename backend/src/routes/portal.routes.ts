import { Router } from "express";
import * as portalCredentialController from "../controllers/portal-credential.controller";
import * as portalSyncController from "../controllers/portal-sync.controller";

const router = Router();

// --- Portal credentials CRUD ---
router.get("/credentials", portalCredentialController.list);
router.get("/credentials/:id", portalCredentialController.getById);
router.post("/credentials", portalCredentialController.create);
router.put("/credentials/:id", portalCredentialController.update);
router.patch("/credentials/:id/active", portalCredentialController.toggleActive);
router.delete("/credentials/:id", portalCredentialController.remove);

// --- Sync operations ---
router.post("/sync", portalSyncController.syncAll);
router.post("/sync/:credentialId", portalSyncController.syncOne);
router.get("/sync/logs", portalSyncController.getLogs);

export default router;
