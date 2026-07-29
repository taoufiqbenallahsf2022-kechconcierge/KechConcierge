import { Router } from "express";
import {
  checkEmail,
  signup,
  login,
  verifyEmail,
  googleAuthController,
} from "../controllers/auth.controller";

const router = Router();

router.post("/check-email", checkEmail);
router.post("/signup", signup);
router.post("/login", login);
router.get("/verify-email", verifyEmail);
router.post("/google-auth", googleAuthController);

export default router;