import express from "express";
import { userControllers } from "./user.controller";
import logger from "../../middleware/logger";
import auth from "../../middleware/auth";

const router = express.Router();

router.get("/", logger, auth("admin"), userControllers.getUser);
router.put("/:userId", logger, auth("admin", "customer"), userControllers.updateUser);
router.delete("/:userId", logger, auth("admin"), userControllers.deleteUser);

export const userRoutes = router;