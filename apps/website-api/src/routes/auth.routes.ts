import { Router } from "express";
import { checkEmail, signup, verifyEmail } from "../controllers/auth.controller";

const router = Router();

router.post("/check-email", checkEmail);
router.post("/signup", signup);
router.get("/verify-email", verifyEmail);

export default router;