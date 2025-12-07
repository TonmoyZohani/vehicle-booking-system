import { Request, Response } from "express";
import { bookingsServices } from "./bookings.services";

const createBooking = async (req: Request, res: Response) => {
  try {
    const authenticatedUser = (req as any).user;
    const bookingData = req.body;

    if (authenticatedUser.role === "customer") {
      bookingData.customer_id = authenticatedUser.userId;
    }

    const result = await bookingsServices.createBooking(bookingData);

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: result,
    });
  } catch (err: any) {
    if (err.message.includes("not available") || err.message.includes("already booked")) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (err.message.includes("not found")) {
      return res.status(404).json({ success: false, message: err.message });
    }

    res.status(500).json({ success: false, message: err.message });
  }
};

const getBookings = async (req: Request, res: Response) => {
  try {
    const authenticatedUser = (req as any).user;

    const result = await bookingsServices.getBookings({
      id: authenticatedUser.userId,
      role: authenticatedUser.role,
    });

    res.status(200).json({
      success: true,
      message: "Bookings retrieved successfully",
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const updateBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const authenticatedUser = (req as any).user;

    const result = await bookingsServices.updateBooking(
      Number(bookingId),
      { id: authenticatedUser.userId, role: authenticatedUser.role },
      { status }
    );

    let message = "Booking updated successfully";

    if (status === "returned" && authenticatedUser.role === "admin") {
      message = "Booking marked as returned. Vehicle is now available";
    } else if (status === "cancelled") {
      message = "Booking cancelled successfully";
    }

    res.status(200).json({
      success: true,
      message,
      data: result,
    });
  } catch (err: any) {
    if (err.message.includes("not found")) {
      return res.status(404).json({ success: false, message: err.message });
    }

    if (
      err.message.includes("Cannot cancel") ||
      err.message.includes("cannot cancel") ||
      err.message.includes("cannot be cancelled")
    ) {
      return res.status(400).json({ success: false, message: err.message });
    }

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const bookingsController = {
  createBooking,
  getBookings,
  updateBooking,
};
