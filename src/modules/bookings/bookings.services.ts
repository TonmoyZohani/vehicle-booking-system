import { pool } from "../../config/db";

const createBooking = async (payload: Record<string, unknown>) => {
  const { customer_id, vehicle_id, rent_start_date, rent_end_date } = payload;

  if (!customer_id || !vehicle_id || !rent_start_date || !rent_end_date) {
    throw new Error(
      "Missing required fields: customer_id, vehicle_id, rent_start_date, rent_end_date"
    );
  }

  const vehicleResult = await pool.query(
    `SELECT * FROM vehicles WHERE id = $1`,
    [vehicle_id]
  );

  if (vehicleResult.rows.length === 0) {
    throw new Error("Vehicle not found");
  }

  const vehicle = vehicleResult.rows[0];

  if (vehicle.availability_status !== "available") {
    throw new Error("Vehicle is not available for booking");
  }

  const startDate = new Date(rent_start_date as string);
  const endDate = new Date(rent_end_date as string);

  if (startDate >= endDate) {
    throw new Error("rent_end_date must be after rent_start_date");
  }

  const days = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const totalPrice = days * parseFloat(vehicle.daily_rent_price);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const bookingQuery = `
      INSERT INTO bookings(customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status)
      VALUES($1, $2, $3, $4, $5, 'active')
      RETURNING *
    `;

    const bookingResult = await client.query(bookingQuery, [
      customer_id,
      vehicle_id,
      rent_start_date,
      rent_end_date,
      totalPrice,
    ]);

    const booking = bookingResult.rows[0];

    const vehicleInfo = await client.query(
      `SELECT vehicle_name, daily_rent_price FROM vehicles WHERE id = $1`,
      [vehicle_id]
    );

    booking.vehicle = vehicleInfo.rows[0];

    await client.query(
      `UPDATE vehicles SET availability_status = 'booked' WHERE id = $1`,
      [vehicle_id]
    );

    await client.query("COMMIT");

    return booking;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getBookings = async (user: { id: number; role: string }) => {
  if (user.role === "admin") {
    const result = await pool.query(`
      SELECT bookings.*, 
             users.name AS customer_name, 
             users.email AS customer_email,
             vehicles.vehicle_name,
             vehicles.registration_number
      FROM bookings
      JOIN users ON bookings.customer_id = users.id
      JOIN vehicles ON bookings.vehicle_id = vehicles.id
      ORDER BY bookings.id DESC
    `);

    return result.rows.map((row) => ({
      id: row.id,
      customer_id: row.customer_id,
      vehicle_id: row.vehicle_id,
      rent_start_date: row.rent_start_date,
      rent_end_date: row.rent_end_date,
      total_price: Number(row.total_price),
      status: row.status,
      customer: {
        name: row.customer_name,
        email: row.customer_email,
      },
      vehicle: {
        vehicle_name: row.vehicle_name,
        registration_number: row.registration_number,
      },
    }));
  }

  const result = await pool.query(
    `
    SELECT bookings.*, 
           vehicles.vehicle_name,
           vehicles.registration_number,
           vehicles.type
    FROM bookings
    JOIN vehicles ON bookings.vehicle_id = vehicles.id
    WHERE bookings.customer_id = $1
    ORDER BY bookings.id DESC
  `,
    [user.id]
  );

  return result.rows.map((row) => ({
    id: row.id,
    vehicle_id: row.vehicle_id,
    rent_start_date: row.rent_start_date,
    rent_end_date: row.rent_end_date,
    total_price: Number(row.total_price),
    status: row.status,
    vehicle: {
      vehicle_name: row.vehicle_name,
      registration_number: row.registration_number,
      type: row.type,
    },
  }));
};

const updateBooking = async (
  bookingId: number,
  user: { id: number; role: string },
  payload: { status?: string }
) => {
  const { status } = payload;

  const bookingRes = await pool.query(
    `SELECT * FROM bookings WHERE id = $1`,
    [bookingId]
  );

  if (bookingRes.rows.length === 0) throw new Error("Booking not found");

  const booking = bookingRes.rows[0];
  const now = new Date();


  if (user.role === "customer") {
    if (status !== "cancelled") {
      throw new Error("Customers can only cancel bookings");
    }
    if (booking.customer_id !== user.id) {
      throw new Error("You cannot cancel someone else’s booking");
    }
    if (new Date(booking.rent_start_date) <= now) {
      throw new Error("Cannot cancel booking after the start date");
    }

    const result = await pool.query(
      `UPDATE bookings 
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [bookingId]
    );

    await pool.query(
      `UPDATE vehicles SET availability_status = 'available' WHERE id = $1`,
      [booking.vehicle_id]
    );

    const updatedBooking = result.rows[0];

    return {
      success: true,
      message: "Booking cancelled successfully",
      data: {
        id: updatedBooking.id,
        customer_id: updatedBooking.customer_id,
        vehicle_id: updatedBooking.vehicle_id,
        rent_start_date: updatedBooking.rent_start_date,
        rent_end_date: updatedBooking.rent_end_date,
        total_price: Number(updatedBooking.total_price),
        status: updatedBooking.status,
      },
    };
  }

  if (user.role === "admin") {
    if (status !== "returned") {
      throw new Error("Admins can only mark bookings as returned");
    }

    const result = await pool.query(
      `UPDATE bookings 
       SET status = 'returned', updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [bookingId]
    );

    await pool.query(
      `UPDATE vehicles SET availability_status = 'available' WHERE id = $1`,
      [booking.vehicle_id]
    );

    const updatedBooking = result.rows[0];

    return {
      success: true,
      message: "Booking marked as returned. Vehicle is now available",
      data: {
        id: updatedBooking.id,
        customer_id: updatedBooking.customer_id,
        vehicle_id: updatedBooking.vehicle_id,
        rent_start_date: updatedBooking.rent_start_date,
        rent_end_date: updatedBooking.rent_end_date,
        total_price: Number(updatedBooking.total_price),
        status: updatedBooking.status,
        vehicle: {
          availability_status: "available",
        },
      },
    };
  }

  throw new Error("Unauthorized operation");
};

export const bookingsServices = {
  createBooking,
  getBookings,
  updateBooking,
};
