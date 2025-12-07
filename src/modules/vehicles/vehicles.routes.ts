import { Router } from "express";
import auth from "../../middleware/auth";
import logger from "../../middleware/logger";
import { vehicleController } from "./vehicles.controller";

const router = Router();
router.get("/", logger, vehicleController.getVehicle);
router.get("/:vehicleId", logger, vehicleController.getSingleVehicle);

router.post("/", logger, auth("admin"), vehicleController.createVehicle);
router.put("/:vehicleId", logger, auth("admin"), vehicleController.updateVehicle);
router.delete("/:vehicleId", logger, auth("admin"), vehicleController.deleteVehicle);

export const vehicleRoutes = router;