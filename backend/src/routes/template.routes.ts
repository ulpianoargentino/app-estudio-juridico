import { Router } from "express";
import * as templateController from "../controllers/template.controller";

const router = Router();

// GET /api/templates/variables — list available template variables (before /:id)
router.get("/variables", templateController.variables);

router.get("/", templateController.list);
router.get("/:id", templateController.getById);
router.post("/", templateController.create);
router.put("/:id", templateController.update);
router.delete("/:id", templateController.remove);

// POST /api/templates/:id/render — render template with case data
router.post("/:id/render", templateController.render);

export default router;
