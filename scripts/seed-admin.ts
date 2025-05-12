import { pool } from "../server/db";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  try {
    const client = await pool.connect();
    
    console.log("Checking for existing admin user...");
    
    // Check if admin already exists
    const existingAdmin = await client.query(
      "SELECT * FROM users WHERE username = $1",
      ["admin"]
    );
    
    if (existingAdmin.rows.length > 0) {
      console.log("Admin user already exists, skipping creation.");
      client.release();
      return;
    }
    
    // Create admin user
    console.log("Creating admin user...");
    
    const hashedPassword = await hashPassword("adminpassword");
    
    await client.query(
      `INSERT INTO users (username, password, email, name, role, status) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        "admin",
        hashedPassword,
        "admin@vegashow.com",
        "Admin User",
        "admin",
        "active"
      ]
    );
    
    console.log("Admin user created successfully!");
    client.release();
  } catch (error) {
    console.error("Error seeding admin user:", error);
  } finally {
    await pool.end();
  }
}

main();