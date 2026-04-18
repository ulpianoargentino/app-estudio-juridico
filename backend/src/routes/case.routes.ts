import { Router } from "express";
import * as caseController from "../controllers/case.controller";
import * as partyController from "../controllers/party.controller";

const router = Router();

// GET /api/cases/summary must be before /:id
router.get("/summary", caseController.summary);

router.get("/", caseController.list);
router.get("/:id", caseController.getById);
router.post("/", caseController.create);
router.put("/:id", caseController.update);
router.delete("/:id", caseController.remove);

// Archive / unarchive
router.post("/:id/archive", caseController.archive);
router.post("/:id/unarchive", caseController.unarchive);

// Sub-expedientes (estilo Tucumán)
router.get("/:id/sub-cases", caseController.listSubCases);
router.post("/:id/sub-cases", caseController.createSubCase);

// Party sub-routes for cases
router.get("/:caseId/parties", partyController.listPartiesOfCase);
router.post("/:caseId/parties", partyController.addPartyToCase);
router.delete("/:caseId/parties/:partyId", partyController.removePartyFromCase);

export default router;
