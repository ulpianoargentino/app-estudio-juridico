import { Router } from "express";
import * as caseController from "../controllers/case.controller";
import * as partyController from "../controllers/party.controller";
import { mountCaseDocumentRoutes } from "./document.routes";

const router = Router();

// GET /api/cases/summary must be before /:id
router.get("/summary", caseController.summary);

router.get("/", caseController.list);
router.get("/:id", caseController.getById);
router.post("/", caseController.create);
router.put("/:id", caseController.update);
router.delete("/:id", caseController.remove);

// Party sub-routes for cases
router.get("/:caseId/parties", partyController.listPartiesOfCase);
router.post("/:caseId/parties", partyController.addPartyToCase);
router.delete("/:caseId/parties/:partyId", partyController.removePartyFromCase);

// Document sub-routes for cases
mountCaseDocumentRoutes(router);

export default router;
