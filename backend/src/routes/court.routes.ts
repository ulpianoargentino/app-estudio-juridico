import { Router } from "express";
import * as courtController from "../controllers/court.controller";

const router = Router();

router.get("/", courtController.list);
router.get("/:id", courtController.getById);
router.post("/", courtController.create);
router.put("/:id", courtController.update);
router.delete("/:id", courtController.remove);

export default router;
