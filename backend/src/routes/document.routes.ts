import { Router } from "express";
import * as documentController from "../controllers/document.controller";
import { uploadMiddleware } from "../middleware/upload";

const router = Router();

// Standalone document routes (download, delete)
router.get("/:id/download", documentController.download);
router.delete("/:id", documentController.remove);

export default router;

// Sub-routes mounted under /cases/:caseId and /matters/:matterId
export function mountCaseDocumentRoutes(parentRouter: Router) {
  parentRouter.post("/:caseId/documents", uploadMiddleware, documentController.uploadForCase);
  parentRouter.get("/:caseId/documents", documentController.listByCase);
}

export function mountMatterDocumentRoutes(parentRouter: Router) {
  parentRouter.post("/:matterId/documents", uploadMiddleware, documentController.uploadForMatter);
  parentRouter.get("/:matterId/documents", documentController.listByMatter);
}
