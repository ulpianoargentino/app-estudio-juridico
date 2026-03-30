import { Router } from "express";
import * as matterController from "../controllers/matter.controller";
import * as partyController from "../controllers/party.controller";
import * as movementController from "../controllers/movement.controller";
import * as eventController from "../controllers/event.controller";

const router = Router();

router.get("/", matterController.list);
router.get("/:id", matterController.getById);
router.post("/", matterController.create);
router.put("/:id", matterController.update);
router.delete("/:id", matterController.remove);
router.post("/:id/convert", matterController.convert);

// Party sub-routes for matters
router.get("/:matterId/parties", partyController.listPartiesOfMatter);
router.post("/:matterId/parties", partyController.addPartyToMatter);
router.delete("/:matterId/parties/:partyId", partyController.removePartyFromMatter);

// Movement sub-routes for matters
router.get("/:matterId/movements", movementController.listByMatter);
router.post("/:matterId/movements", movementController.createForMatter);

// Event sub-routes for matters
router.get("/:matterId/events", eventController.listByMatter);

export default router;
