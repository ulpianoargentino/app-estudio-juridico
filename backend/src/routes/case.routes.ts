import { Router } from "express";
import * as caseController from "../controllers/case.controller";
import * as partyController from "../controllers/party.controller";
import * as movementController from "../controllers/movement.controller";
import * as errandController from "../controllers/errand.controller";
import * as eventController from "../controllers/event.controller";

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

// Movement sub-routes for cases
router.get("/:caseId/movements", movementController.listByCase);
router.post("/:caseId/movements", movementController.createForCase);

// Errand sub-routes for cases
router.get("/:caseId/errands", errandController.listByCase);
router.post("/:caseId/errands", errandController.createForCase);

// Event sub-routes for cases
router.get("/:caseId/events", eventController.listByCase);

export default router;
