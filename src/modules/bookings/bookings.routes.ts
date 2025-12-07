import { Router } from "express";
import auth from "../../middleware/auth";
import logger from "../../middleware/logger";
import { bookingsController } from "./bookings.controller";

const router = Router();

// Customer or Admin can create bookings
router.post("/", logger, auth("admin", "customer"), bookingsController.createBooking);

// Admin sees all, Customer sees own
router.get("/", logger, auth("admin", "customer"), bookingsController.getBookings);

// Update booking (cancel or mark returned)
router.put("/:bookingId", logger, auth("admin", "customer"), bookingsController.updateBooking);

export const bookingsRoutes = router;