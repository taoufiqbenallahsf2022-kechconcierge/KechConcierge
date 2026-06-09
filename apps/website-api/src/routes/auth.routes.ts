import { Router } from "express";
import {
  checkEmail,
  signup,
  verifyEmail,
  googleSignupController,
} from "../controllers/auth.controller";

const router = Router();

router.post("/check-email", checkEmail);
router.post("/signup", signup);
router.get("/verify-email", verifyEmail);
router.post("/google-auth", googleSignupController);

export default router;