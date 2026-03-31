import { Router } from "express";
import * as templateController from "../controllers/template.controller";

const router = Router();

router.get("/", templateController.list);
router.get("/:id", templateController.getById);
router.post("/:id/render", templateController.render);

export default router;
