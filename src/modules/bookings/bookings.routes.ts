import { Router } from "express";
import auth from "../../middleware/auth";
import logger from "../../middleware/logger";
import { bookingsController } from "./bookings.controller";

const router = Router();

router.post("/", logger, auth("admin", "customer"), bookingsController.createBooking);
router.get("/", logger, auth("admin", "customer"), bookingsController.getBookings);
router.put("/:bookingId", logger, auth("admin", "customer"), bookingsController.updateBooking);

export const bookingsRoutes = router;