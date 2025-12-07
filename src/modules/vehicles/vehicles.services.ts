import { pool } from "../../config/db";

const createVehicle = async (payload: Record<string, unknown>) => {
  const {
    vehicle_name,
    type,
    registration_number,
    daily_rent_price,
    availability_status = "available", 
  } = payload;

  const existingVehicle = await pool.query(
    `SELECT * FROM vehicles WHERE registration_number = $1`,
    [registration_number]
  );

  if (existingVehicle.rows.length > 0) {
    throw new Error("Vehicle with this registration number already exists");
  }

  const result = await pool.query(
    `INSERT INTO vehicles(vehicle_name, type, registration_number, daily_rent_price, availability_status) 
     VALUES($1, $2, $3, $4, $5) 
     RETURNING id, vehicle_name, type, registration_number, daily_rent_price, availability_status, created_at, updated_at`,
    [
      vehicle_name,
      type,
      registration_number,
      daily_rent_price,
      availability_status,
    ]
  );

  return result.rows[0];
};

const getVehicle = async () => {
  const result = await pool.query(
    `SELECT id, vehicle_name, type, registration_number, daily_rent_price, availability_status, created_at, updated_at 
     FROM vehicles 
     ORDER BY created_at DESC`
  );
  return result.rows;
};

const getSingleVehicle = async (vehicleId: string) => {
  const result = await pool.query(
    `SELECT id, vehicle_name, type, registration_number, daily_rent_price, availability_status, created_at, updated_at 
     FROM vehicles 
     WHERE id = $1`,
    [vehicleId]
  );

  return result.rows[0] || null;
};

const updateVehicle = async (
  vehicleId: string,
  payload: Record<string, unknown>
) => {
  const {
    vehicle_name,
    type,
    registration_number,
    daily_rent_price,
    availability_status,
  } = payload;

  const duplicateReg = await pool.query(
    `SELECT * FROM vehicles WHERE registration_number = $1 AND id != $2`,
    [registration_number, vehicleId]
  );
  
  if (duplicateReg.rows.length > 0) {
    throw new Error("Registration number already exists for another vehicle");
  }

  const query = `
    UPDATE vehicles 
    SET vehicle_name = $1, 
        type = $2, 
        registration_number = $3, 
        daily_rent_price = $4, 
        availability_status = $5,
        updated_at = NOW()
    WHERE id = $6
    RETURNING id, vehicle_name, type, registration_number, daily_rent_price, availability_status, created_at, updated_at
  `;

  const result = await pool.query(query, [
    vehicle_name,
    type,
    registration_number,
    daily_rent_price,
    availability_status,
    vehicleId,
  ]);

  if (result.rows.length === 0) {
    throw new Error("Vehicle not found");
  }

  return result.rows[0];
};

const deleteVehicle = async (vehicleId: string) => {
 
  const existingVehicle = await pool.query(
    `SELECT * FROM vehicles WHERE id = $1`,
    [vehicleId]
  );

  if (existingVehicle.rows.length === 0) {
    throw new Error("Vehicle not found");
  }

  const activeBookings = await pool.query(
    `SELECT * FROM bookings WHERE vehicle_id = $1 AND status = 'active'`,
    [vehicleId]
  );

  if (activeBookings.rows.length > 0) {
    throw new Error("Cannot delete vehicle with active bookings");
  }

  const result = await pool.query(
    `DELETE FROM vehicles WHERE id = $1 
     RETURNING id, vehicle_name, registration_number`,
    [vehicleId]
  );

  return result.rows[0];
};

export const vehicleServices = {
  createVehicle,
  getVehicle,
  getSingleVehicle,
  updateVehicle,
  deleteVehicle,
};