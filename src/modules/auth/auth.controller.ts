import { Request, Response } from "express";
import { authServices } from "./auth.service";

const signUpUser = async (req: Request, res: Response) => {
  const { name, email, password, phone, role } = req.body;
  try {
    const result = await authServices.signUpUser(
      name,
      email,
      password,
      phone,
      role
    );

    console.log("Result", result);

    if (!result) {
      return res.status(400).json({
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
