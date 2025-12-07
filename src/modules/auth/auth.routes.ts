import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

router.post("/signup",authController.signUpUser);
router.post("/signin", authController.signInUser);

export const authRoutes = router;
