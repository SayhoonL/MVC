import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  signupController,
  loginController,
  refreshController,
  getMeController,
} from "../controllers/authController.js";

const router = Router();

router.post("/signup", signupController);
router.post("/login", loginController);
router.post("/refresh", refreshController);
router.get("/me", authMiddleware, getMeController);

export default router;
