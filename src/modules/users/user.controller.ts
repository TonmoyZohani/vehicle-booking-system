import { Request, Response } from "express";
import { userServices } from "./user.service";

// Note: createUser should not exist - use auth/signup instead
const getUser = async (req: Request, res: Response) => {
  try {
    const result = await userServices.getUser();

    const message = result.length > 0 
      ? "Users retrieved successfully" 
      : "No users found";

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



const updateUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const updateData = req.body;
  
  try {
    const authenticatedUser = (req as any).user;
    
    if (authenticatedUser.role !== 'admin' && authenticatedUser.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own profile",
      });
    }
    
    if (updateData.role && authenticatedUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only admin can change user roles",
      });
    }

    const result = await userServices.updateUser(userId!, updateData);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: result,
    });
  } catch (err: any) {
    if (err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: err.message,
      });
    }
    if (err.message.includes('already exists')) {
      return res.status(409).json({
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

const deleteUser = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const result = await userServices.deleteUser(userId!);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: result,
    });
  } catch (err: any) {
    if (err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: err.message,
      });
    }
    if (err.message.includes('active bookings')) {
      return res.status(400).json({
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

export const userControllers = {
  getUser,
  updateUser,
  deleteUser,
};