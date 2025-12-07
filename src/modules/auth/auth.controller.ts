import { Request, Response } from "express";
import { authServices } from "./auth.service";

const signUpUser = async (req: Request, res: Response) => {
  const { name, email, password, phone, role = 'customer' } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: name, email, password, phone",
    });
  }

  try {
    const result = await authServices.signUpUser(
      name,
      email,
      password,
      phone,
      role
    );

    if (!result) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (err: any) {
    if (err.message.includes('must be') || err.message.includes('required')) {
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

const signInUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const result = await authServices.signInUser(email, password);
    res.status(200).json({
      success: false,
      message: "Login successful",
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const authController = {
  signUpUser,
  signInUser,
};
