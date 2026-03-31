import { Router } from "express";
import * as documentController from "../controllers/document.controller";

const router = Router();

router.get("/", documentController.list);
router.get("/:id", documentController.getById);
router.post("/", documentController.create);
router.delete("/:id", documentController.remove);

export default router;
