import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as authController from "../controllers/auth.controller";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", authMiddleware, authController.me);
router.put("/change-password", authMiddleware, authController.changePassword);
router.put("/profile", authMiddleware, authController.updateProfile);

export default router;
