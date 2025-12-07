import express from "express";
import { userControllers } from "./user.controller";
import logger from "../../middleware/logger";
import auth from "../../middleware/auth";

const router = express.Router();

// Admin only - view all users
router.get("/", logger, auth("admin"), userControllers.getUser);

// PUT: Require authentication (admin or user)
router.put("/:userId", logger, auth("admin", "customer"), userControllers.updateUser);

// DELETE: Admin only
router.delete("/:userId", logger, auth("admin"), userControllers.deleteUser);

export const userRoutes = router;