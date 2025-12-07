import { pool } from "../../config/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../../config";

const signUpUser = async (
  name: string,
  email: string,
  password: string,
  phone: string,
  role: string
) => {
  const lowerCaseEmail = email.toLowerCase();

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  if (role && !["admin", "customer"].includes(role)) {
    throw new Error('Role must be either "admin" or "customer"');
  }

  const result = await pool.query(`SELECT * FROM users WHERE email=$1`, [
    lowerCaseEmail,
  ]);

  if (result.rows.length > 0) {
    return null;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const query = `INSERT INTO users (name, email, password, phone, role) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING id, name, email, phone, role, created_at`;

  const data = await pool.query(query, [
    name,
    lowerCaseEmail,
    hashedPassword,
    phone,
    role,
  ]);

  return data.rows[0];
};

const signInUser = async (email: string, password: string) => {
  const result = await pool.query(`SELECT * FROM users WHERE email=$1`, [
    email,
  ]);

  if (result.rows.length === 0) {
    return null;
  }
  const user = result.rows[0];

  const match = await bcrypt.compare(password, user.password);

  console.log({ match, user });
  if (!match) {
    return false;
  }

  const token = jwt.sign(
    { name: user.name, email: user.email, role: user.role },
    config.jwtSecret as string,
    {
      expiresIn: "7d",
    }
  );

  return { token, user };
};

export const authServices = {
  signUpUser,
  signInUser,
};
