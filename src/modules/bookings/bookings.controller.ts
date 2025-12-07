import { Request, Response } from "express";
import { bookingsServices } from "./bookings.services";

const createBooking = async (req: Request, res: Response) => {
  try {
    const authenticatedUser = (req as any).user;
    const bookingData = req.body;

    if (authenticatedUser.role === 'customer') {
      bookingData.customer_id = authenticatedUser.userId;
    }

    const result = await bookingsServices.createBooking(bookingData);

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: result,
    });
  } catch (err: any) {
    if (err.message.includes('not available') || err.message.includes('already booked')) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    if (err.message.includes('not found')) {
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

const getBookings = async (req: Request, res: Response) => {
  try {
    const authenticatedUser = (req as any).user;
    
    let result;
    if (authenticatedUser.role === 'admin') {
      // Admin gets all bookings
      result = await bookingsServices.getAllBookings();
    } else {
      // Customer gets only their own bookings
      result = await bookingsServices.getUserBookings(authenticatedUser.userId);
    }

    const message = result.length > 0 
      ? (authenticatedUser.role === 'admin' 
          ? "Bookings retrieved successfully" 
          : "Your bookings retrieved successfully")
      : "No bookings found";

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

const updateBooking = async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const { status } = req.body;
  const authenticatedUser = (req as any).user;

  try {
    if (authenticatedUser.role !== 'admin') {
      const booking = await bookingsServices.getSingleBooking(bookingId!);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }
      
      if (booking.customer_id !== authenticatedUser.userId) {
        return res.status(403).json({
          success: false,
          message: "You can only update your own bookings",
        });
      }
      
      // Customer can only set status to 'cancelled'
      if (status !== 'cancelled') {
        return res.status(400).json({
          success: false,
          message: "Customers can only cancel bookings",
        });
      }
    }

    const result = await bookingsServices.updateBooking(bookingId!, status, authenticatedUser.role);

    let message = "Booking updated successfully";
    if (status === 'returned' && authenticatedUser.role === 'admin') {
      message = "Booking marked as returned. Vehicle is now available";
    } else if (status === 'cancelled') {
      message = "Booking cancelled successfully";
    }

    res.status(200).json({
      success: true,
      message,
      data: result,
    });
  } catch (err: any) {
    if (err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: err.message,
      });
    }
    if (err.message.includes('cannot be cancelled') || err.message.includes('cannot be returned')) {
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

export const bookingsController = {
  createBooking,
  getBookings,
  updateBooking,
};