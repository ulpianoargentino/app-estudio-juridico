import { Router } from "express";
import * as personController from "../controllers/person.controller";

const router = Router();

// GET /api/persons/search?q=xxx — autocomplete (must be before /:id)
router.get("/search", personController.search);

// GET /api/persons — list with filters and pagination
router.get("/", personController.list);

// GET /api/persons/:id — detail with party links
router.get("/:id", personController.getById);

// POST /api/persons — create
router.post("/", personController.create);

// PUT /api/persons/:id — update
router.put("/:id", personController.update);

// DELETE /api/persons/:id — soft delete
router.delete("/:id", personController.remove);

export default router;
