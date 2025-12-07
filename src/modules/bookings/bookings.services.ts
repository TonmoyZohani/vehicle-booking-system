import { pool } from "../../config/db";

const createBooking = async (payload: Record<string, unknown>) => {
  const { customer_id, vehicle_id, rent_start_date, rent_end_date } = payload;

  if (!customer_id || !vehicle_id || !rent_start_date || !rent_end_date) {
    throw new Error("Missing required fields: customer_id, vehicle_id, rent_start_date, rent_end_date");
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

  const customerResult = await pool.query(
    `SELECT * FROM users WHERE id = $1`,
    [customer_id]
  );

  if (customerResult.rows.length === 0) {
    throw new Error("Customer not found");
  }

  const startDate = new Date(rent_start_date as string);
  const endDate = new Date(rent_end_date as string);

  if (startDate >= endDate) {
    throw new Error("rent_end_date must be after rent_start_date");
  }

  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
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
      totalPrice
    ]);

    await client.query(
      `UPDATE vehicles SET availability_status = 'booked' WHERE id = $1`,
      [vehicle_id]
    );

    await client.query("COMMIT");
    return bookingResult.rows[0];

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};


const getBookings = async (user: { id: number; role: string }) => {
  if (user.role === "admin") {
    const result = await pool.query(`SELECT * FROM bookings ORDER BY id DESC`);
    return result.rows;
  }

  const result = await pool.query(
    `SELECT * FROM bookings WHERE customer_id = $1 ORDER BY id DESC`,
    [user.id]
  );

  return result.rows;
};


const updateBooking = async (
  bookingId: number,
  user: { id: number; role: string },
  payload: { status?: string }
) => {
  const bookingResult = await pool.query(
    `SELECT * FROM bookings WHERE id = $1`,
    [bookingId]
  );

  if (bookingResult.rows.length === 0) {
    throw new Error("Booking not found");
  }

  const booking = bookingResult.rows[0];

  const now = new Date();

  if (user.role === "customer") {
    if (booking.customer_id !== user.id) {
      throw new Error("You cannot cancel someone else's booking");
    }

    if (new Date(booking.rent_start_date) <= now) {
      throw new Error("Cannot cancel booking after the start date");
    }

    const cancelQuery = `
      UPDATE bookings SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1 RETURNING *
    `;

    const result = await pool.query(cancelQuery, [bookingId]);

    await pool.query(
      `UPDATE vehicles SET availability_status = 'available' WHERE id = $1`,
      [booking.vehicle_id]
    );

    return result.rows[0];
  }

  if (user.role === "admin") {
    const result = await pool.query(
      `UPDATE bookings SET status = 'returned', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [bookingId]
    );

    await pool.query(
      `UPDATE vehicles SET availability_status = 'available' WHERE id = $1`,
      [booking.vehicle_id]
    );

    return result.rows[0];
  }

  throw new Error("Unauthorized operation");
};


export const bookingsServices = {
  createBooking,
  getBookings,
  updateBooking,
};