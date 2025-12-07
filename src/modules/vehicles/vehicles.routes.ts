import { Router } from "express";
import { vehicleController } from "./vehicles.controller";

const router = Router();

router.post("/", vehicleController.createVehicle);
router.get("/", vehicleController.getVehicle);
router.get("/:vehicleId", vehicleController.getSingleVehicle); // Use vehicleId consistently
router.put("/:vehicleId", vehicleController.updateVehicle);
router.delete("/:vehicleId", vehicleController.deleteVehicle);

export const vehicleRoutes = router;