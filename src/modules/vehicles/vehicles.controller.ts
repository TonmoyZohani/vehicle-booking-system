import { Request, Response } from "express";
import { vehicleServices } from "./vehicles.services";

const createVehicle = async (req: Request, res: Response) => {
  try {
    const result = await vehicleServices.createVehicle(req.body);

    res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: result,
    });
  } catch (err: any) {
    if (err.message.includes("already exists")) {
      return res.status(409).json({
        success: false,
        message: err.message,
      });
    }
    res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
};

const getVehicle = async (req: Request, res: Response) => {
  try {
    const result = await vehicleServices.getVehicle();

    const message =
      result.length > 0
        ? "Vehicles retrieved successfully"
        : "No vehicles found";

    res.status(200).json({
      success: true,
      message,
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getSingleVehicle = async (req: Request, res: Response) => {
  const { vehicleId } = req.params;

  try {
    const result = await vehicleServices.getSingleVehicle(vehicleId!);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehicle retrieved successfully",
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const updateVehicle = async (req: Request, res: Response) => {
  const { vehicleId } = req.params;
  const updateData = req.body;

  console.log(req.body);
  console.log(vehicleId)

  try {
    const result = await vehicleServices.updateVehicle(vehicleId!, updateData);

    res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      data: result,
    });
  } catch (err: any) {
    if (err.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: err.message,
      });
    }
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const deleteVehicle = async (req: Request, res: Response) => {
  const { vehicleId } = req.params;

  try {
    const result = await vehicleServices.deleteVehicle(vehicleId!);

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (err: any) {
    if (err.message.includes("active bookings")) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    if (err.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: err.message,
      });
    }
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const vehicleController = {
  createVehicle,
  getVehicle,
  getSingleVehicle,
  updateVehicle,
  deleteVehicle,
};
