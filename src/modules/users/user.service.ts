import { pool } from "../../config/db";
import bcrypt from "bcryptjs";

const getUser = async () => {
  const result = await pool.query(
    `SELECT id, name, email, phone, role, created_at, updated_at 
     FROM users 
     ORDER BY created_at DESC`
  );
  return result.rows; 
};

const updateUser = async (userId: string, payload: Record<string, unknown>) => {
  const { name, email, phone, role, password } = payload;

  const existingUser = await pool.query(
    `SELECT * FROM users WHERE id = $1`,
    [userId]
  );

  if (existingUser.rows.length === 0) {
    throw new Error("User not found");
  }

  if (email && email !== existingUser.rows[0].email) {
    const duplicateEmail = await pool.query(
      `SELECT * FROM users WHERE email = $1 AND id != $2`,
      [email, userId]
    );
    
    if (duplicateEmail.rows.length > 0) {
      throw new Error("Email already exists for another user");
    }
  }

  const updateName = name !== undefined ? name : existingUser.rows[0].name;
  const updateEmail = email !== undefined ? email : existingUser.rows[0].email;
  const updatePhone = phone !== undefined ? phone : existingUser.rows[0].phone;
  const updateRole = role !== undefined ? role : existingUser.rows[0].role;
  
  let updatePassword = existingUser.rows[0].password;
  if (password) {
    updatePassword = await bcrypt.hash(password as string, 10);
  }

  const query = `
    UPDATE users 
    SET name = $1, 
        email = $2, 
        phone = $3, 
        role = $4, 
        password = $5,
        updated_at = NOW()
    WHERE id = $6
    RETURNING id, name, email, phone, role, created_at, updated_at
  `;

  const result = await pool.query(query, [
    updateName,
    updateEmail,
    updatePhone,
    updateRole,
    updatePassword,
    userId,
  ]);

  return result.rows[0];
};

const deleteUser = async (userId: string) => {
  const existingUser = await pool.query(
    `SELECT * FROM users WHERE id = $1`,
    [userId]
  );

  if (existingUser.rows.length === 0) {
    throw new Error("User not found");
  }

  const activeBookings = await pool.query(
    `SELECT * FROM bookings WHERE customer_id = $1 AND status = 'active'`,
    [userId]
  );

  if (activeBookings.rows.length > 0) {
    throw new Error("Cannot delete user with active bookings");
  }

  const result = await pool.query(
    `DELETE FROM users WHERE id = $1 
     RETURNING id, name, email`,
    [userId]
  );

  return result.rows[0];
};

export const userServices = {
  getUser,
  updateUser,
  deleteUser,
};