import express, { Request, Response } from "express";
import { userControllers } from "./user.controller";
import logger from "../../middleware/logger";
import auth from "../../middleware/auth";

const router = express.Router();

// router.get("/", logger, auth("admin"), userControllers.getUser);
router.get("/", userControllers.getUser);

router.put("/:userId", userControllers.updateUser);

router.delete("/:userId", userControllers.deleteUser);

export const userRoutes = router;
