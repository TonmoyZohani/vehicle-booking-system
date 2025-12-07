import { pool } from "../../config/db";

const createBooking = async (payload: Record<string, unknown>) => {
  const { customer_id, vehicle_id, rent_start_date, rent_end_date } = payload;

  // 1. Validate required fields
  if (!customer_id || !vehicle_id || !rent_start_date || !rent_end_date) {
    throw new Error("Missing required fields: customer_id, vehicle_id, rent_start_date, rent_end_date");
  }

  // 2. Check if vehicle exists and is available
  const vehicleResult = await pool.query(
    `SELECT * FROM vehicles WHERE id = $1`,
    [vehicle_id]
  );

  if (vehicleResult.rows.length === 0) {
    throw new Error("Vehicle not found");
  }

  const vehicle = vehicleResult.rows[0];
  
  if (vehicle.availability_status !== 'available') {
    throw new Error("Vehicle is not available for booking");
  }

  // 3. Check if customer exists
  const customerResult = await pool.query(
    `SELECT * FROM users WHERE id = $1`,
    [customer_id]
  );

  if (customerResult.rows.length === 0) {
    throw new Error("Customer not found");
  }

  // 4. Calculate total price
  const startDate = new Date(rent_start_date as string);
  const endDate = new Date(rent_end_date as string);
  
  // Validate dates
  if (startDate >= endDate) {
    throw new Error("rent_end_date must be after rent_start_date");
  }
  
  const numberOfDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalPrice = numberOfDays * parseFloat(vehicle.daily_rent_price);

  // 5. Create booking in transaction
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Insert booking
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

    // Update vehicle status
    await client.query(
      `UPDATE vehicles SET availability_status = 'booked', updated_at = NOW() WHERE id = $1`,
      [vehicle_id]
    );

    await client.query('COMMIT');

    // Get booking with vehicle details
    const finalQuery = `
      SELECT 
        b.*,
        json_build_object(
          'vehicle_name', v.vehicle_name,
          'daily_rent_price', v.daily_rent_price
        ) as vehicle
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.id = $1
    `;
    
    const finalResult = await pool.query(finalQuery, [bookingResult.rows[0].id]);

    return finalResult.rows[0];
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getAllBookings = async () => {
  const query = `
    SELECT 
      b.*,
      json_build_object(
        'name', u.name,
        'email', u.email
      ) as customer,
      json_build_object(
        'vehicle_name', v.vehicle_name,
        'registration_number', v.registration_number
      ) as vehicle
    FROM bookings b
    JOIN users u ON b.customer_id = u.id
    JOIN vehicles v ON b.vehicle_id = v.id
    ORDER BY b.created_at DESC
  `;
  
  const result = await pool.query(query);
  return result.rows;
};

const getUserBookings = async (userId: number) => {
  const query = `
    SELECT 
      b.id,
      b.vehicle_id,
      b.rent_start_date,
      b.rent_end_date,
      b.total_price,
      b.status,
      b.created_at,
      json_build_object(
        'vehicle_name', v.vehicle_name,
        'registration_number', v.registration_number,
        'type', v.type
      ) as vehicle
    FROM bookings b
    JOIN vehicles v ON b.vehicle_id = v.id
    WHERE b.customer_id = $1
    ORDER BY b.created_at DESC
  `;
  
  const result = await pool.query(query, [userId]);
  return result.rows;
};

const getSingleBooking = async (bookingId: string) => {
  const query = `
    SELECT * FROM bookings WHERE id = $1
  `;
  
  const result = await pool.query(query, [bookingId]);
  return result.rows[0] || null;
};

const updateBooking = async (bookingId: string, status: string, userRole: string) => {
  // Get current booking
  const bookingResult = await pool.query(
    `SELECT * FROM bookings WHERE id = $1`,
    [bookingId]
  );

  if (bookingResult.rows.length === 0) {
    throw new Error("Booking not found");
  }

  const booking = bookingResult.rows[0];
  const currentDate = new Date();
  const startDate = new Date(booking.rent_start_date);

  // Business rules validation
  if (userRole === 'customer' && status === 'cancelled') {
    // Customer can only cancel before start date
    if (currentDate >= startDate) {
      throw new Error("Booking cannot be cancelled after start date");
    }
  }

  if (userRole === 'admin' && status === 'returned') {
    // Admin can mark as returned
    // Update vehicle status back to available
    await pool.query(
      `UPDATE vehicles SET availability_status = 'available', updated_at = NOW() WHERE id = $1`,
      [booking.vehicle_id]
    );
  }

  // Update booking status
  const updateQuery = `
    UPDATE bookings 
    SET status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `;
  
  const updateResult = await pool.query(updateQuery, [status, bookingId]);

  // If returned, include vehicle info in response
  if (status === 'returned' && userRole === 'admin') {
    const vehicleResult = await pool.query(
      `SELECT availability_status FROM vehicles WHERE id = $1`,
      [booking.vehicle_id]
    );
    
    return {
      ...updateResult.rows[0],
      vehicle: {
        availability_status: vehicleResult.rows[0].availability_status
      }
    };
  }

  return updateResult.rows[0];
};

export const bookingsServices = {
  createBooking,
  getAllBookings,
  getUserBookings,
  getSingleBooking,
  updateBooking,
};