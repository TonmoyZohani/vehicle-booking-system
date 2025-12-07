import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";

const auth = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "You are not authorized!",
        });
      }

      const tokenWithoutBearer = token.startsWith("Bearer ")
        ? token.split(" ")[1]
        : token;

      const decoded = jwt.verify(
        tokenWithoutBearer as string,
        config.jwtSecret as string
      ) as JwtPayload;

      console.log({ decoded });
      req.user = decoded;

      if (roles.length && !roles.includes(decoded.role as string)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to access this resource!",
        });
      }

      next();
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token has expired!",
        });
      }

      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token!",
        });
      }

      res.status(500).json({
        success: false,
        message: "Authentication failed!",
      });
    }
  };
};

export default auth;
