// Import the pg module
import pg from 'pg';
import crypto from 'crypto';
import util from 'util';

// Create a PostgreSQL pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Promisify scrypt
const scryptAsync = util.promisify(crypto.scrypt);

// Hash password function
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

// Define a common password for all test users
const commonPassword = 'password123';

// User data for seeding
const users = [
  {
    username: 'admin',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin'
  },
  {
    username: 'customer1',
    email: 'customer1@example.com',
    name: 'Sarah Johnson',
    role: 'customer'
  },
  {
    username: 'customer2',
    email: 'customer2@example.com',
    name: 'Michael Chen',
    role: 'customer'
  },
  {
    username: 'customer3',
    email: 'customer3@example.com',
    name: 'Emily Rodriguez',
    role: 'customer'
  },
  {
    username: 'dj_beats',
    email: 'dj@example.com',
    name: 'DJ Maestro',
    role: 'provider'
  },
  {
    username: 'photo_pro',
    email: 'photographer@example.com',
    name: 'Lens Master',
    role: 'provider'
  },
  {
    username: 'dance_crew',
    email: 'dancers@example.com',
    name: 'Rhythm Squad',
    role: 'provider'
  },
  {
    username: 'magic_show',
    email: 'magician@example.com',
    name: 'Mystic Wonder',
    role: 'provider'
  }
];

// Create a user
async function createUser(userData) {
  try {
    const hashedPassword = await hashPassword(commonPassword);
    
    // Check if user already exists
    const checkResult = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [userData.username]
    );
    
    if (checkResult.rows.length > 0) {
      console.log(`User ${userData.username} already exists, skipping`);
      return checkResult.rows[0].id;
    }
    
    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (username, password, email, name, role, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [
        userData.username,
        hashedPassword,
        userData.email,
        userData.name,
        userData.role,
        'active',
        new Date()
      ]
    );
    
    console.log(`Created ${userData.role}: ${userData.name} (${userData.username})`);
    return result.rows[0].id;
  } catch (error) {
    console.error(`Error creating user ${userData.username}:`, error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log('Starting user seed script...');
    console.log(`Common password for all users: ${commonPassword}`);
    
    // Create all users
    for (const user of users) {
      await createUser(user);
    }
    
    console.log('User seeding completed successfully!');
  } catch (error) {
    console.error('Error in seed script:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the main function
main();