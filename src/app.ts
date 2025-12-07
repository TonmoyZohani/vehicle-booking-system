import express, { Request, Response } from "express";
import config from "./config";
import initDB from "./config/db";
import logger from "./middleware/logger";
import { userRoutes } from "./modules/users/user.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { vehicleRoutes } from "./modules/vehicles/vehicles.routes";

const app = express();
// parser
app.use(express.json());
// app.use(express.urlencoded());

// initializing DB
initDB();

// "/" -> localhost:5000/
app.get("/", logger, (req: Request, res: Response) => {
  res.send("Hello Next Level Developers!");
});

//auth routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/vehicles", vehicleRoutes);
app.use("/api/v1/users", userRoutes);




app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

export default app;
