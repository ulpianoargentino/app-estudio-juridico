import { Router } from "express";
import * as matterController from "../controllers/matter.controller";
import * as partyController from "../controllers/party.controller";
import { mountMatterDocumentRoutes } from "./document.routes";

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

// Document sub-routes for matters
mountMatterDocumentRoutes(router);

export default router;
