/**
 * Reset Database Script
 * --------------------
 * This script deletes all data from all tables and creates fresh users:
 * - 1 admin user
 * - 3 customer users
 * - 3 provider (talent) users
 * 
 * All users are created with status="active" and password="password123" (admin uses "adminpassword")
 */

import { Pool } from 'pg';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

// Import environment variables
import '../load-env.js';

const scryptAsync = promisify(scrypt);

// Connect to database using explicit AWS RDS credentials
// Using the exact connection details shown in the server logs
const connectionConfig = {
  host: 'vegadevvemsdb.cbw0ei0cqj16.me-south-1.rds.amazonaws.com',
  port: 5432,
  user: 'vega',
  password: process.env.AWS_RDS_PASSWORD || process.env.PGPASSWORD,
  database: 'vegadevvemsdb',
  ssl: false // Disable SSL as per user's note
};

console.log(`Connecting to database at: ${connectionConfig.host || 'via connection string'}`);
const pool = new Pool(connectionConfig);

/**
 * Utility function to hash passwords
 */
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

/**
 * Clean the database by deleting all data
 */
async function cleanDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database cleanup...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Get all tables in the database
    const tableQuery = `
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT IN ('_drizzle_migrations')
    `;
    const tables = await client.query(tableQuery);
    
    // First disable all foreign key constraints
    await client.query('SET CONSTRAINTS ALL DEFERRED');
    
    // Delete data from all tables in reverse dependency order
    console.log('Cleaning tables...');
    
    // Delete from related tables first
    await client.query('DELETE FROM proposals'); 
    await client.query('DELETE FROM bookings');
    await client.query('DELETE FROM portfolio_items');
    await client.query('DELETE FROM services');
    await client.query('DELETE FROM reviews');
    await client.query('DELETE FROM messages');
    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM activities');
    await client.query('DELETE FROM payments');
    await client.query('DELETE FROM availability');
    await client.query('DELETE FROM provider_profiles');
    await client.query('DELETE FROM events');
    await client.query('DELETE FROM users');
    
    // Reset sequences for ID columns
    const sequenceQuery = `
      SELECT c.relname AS table_name, a.attname AS column_name, 
             pg_get_serial_sequence(c.relname, a.attname) as seq_name
      FROM pg_class c 
      JOIN pg_attribute a ON c.oid = a.attrelid 
      WHERE c.relkind = 'r' 
        AND a.attnum > 0 
        AND NOT a.attisdropped 
        AND a.attidentity = 'd' 
        AND c.relname NOT LIKE 'pg_%' 
        AND c.relname NOT LIKE 'sql_%' 
        AND c.relnamespace IN (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ORDER BY c.relname, a.attnum;
    `;
    
    const sequences = await client.query(sequenceQuery);
    
    for (const seq of sequences.rows) {
      if (seq.seq_name) {
        console.log(`Resetting sequence: ${seq.seq_name}`);
        await client.query(`ALTER SEQUENCE ${seq.seq_name} RESTART WITH 1`);
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('All tables have been cleaned.');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cleaning database:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Create all test users
 */
async function createUsers() {
  console.log('Creating test users...');
  
  const adminPassword = await hashPassword('adminpassword');
  const standardPassword = await hashPassword('password123');
  
  const users = [
    // Admin
    {
      username: 'admin',
      email: 'admin@vegashow.ai',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
      status: 'active',
      phone: '123-456-7890',
      country: 'United States',
      city: 'New York',
      nationality: 'US',
      bio: 'System administrator',
      avatar_url: null,
      is_organization: false,
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // Customers
    {
      username: 'customer1',
      email: 'customer1@example.com',
      password: standardPassword,
      name: 'Alice Johnson',
      role: 'customer',
      status: 'active',
      phone: '555-123-4567',
      country: 'United States',
      city: 'Los Angeles',
      nationality: 'US',
      bio: 'Event organizer for corporate functions',
      avatar_url: null,
      is_organization: false,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      username: 'customer2',
      email: 'customer2@example.com',
      password: standardPassword,
      name: 'Bob Smith',
      role: 'customer',
      status: 'active',
      phone: '555-234-5678',
      country: 'United States',
      city: 'Chicago',
      nationality: 'US',
      bio: 'Wedding planner',
      avatar_url: null,
      is_organization: false,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      username: 'customer3',
      email: 'customer3@example.com',
      password: standardPassword,
      name: 'Carol Martinez',
      role: 'customer',
      status: 'active',
      phone: '555-345-6789',
      country: 'United States',
      city: 'Miami',
      nationality: 'US',
      bio: 'Festival organizer',
      avatar_url: null,
      is_organization: false,
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // Providers (Talent)
    {
      username: 'dj_beats',
      email: 'dj_beats@example.com',
      password: standardPassword,
      name: 'DJ Beats',
      role: 'provider',
      status: 'active',
      phone: '555-678-1234',
      country: 'United States',
      city: 'Miami',
      nationality: 'US',
      bio: 'Professional DJ with 10+ years of experience in various events.',
      avatar_url: null,
      is_organization: false,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      username: 'photo_pro',
      email: 'photo_pro@example.com',
      password: standardPassword,
      name: 'Photo Pro',
      role: 'provider',
      status: 'active',
      phone: '555-789-2345',
      country: 'United States',
      city: 'New York',
      nationality: 'US',
      bio: 'Award-winning photographer specializing in weddings and corporate events.',
      avatar_url: null,
      is_organization: false,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      username: 'dance_crew',
      email: 'dance_crew@example.com',
      password: standardPassword,
      name: 'Elite Dance Crew',
      role: 'provider',
      status: 'active',
      phone: '555-890-3456',
      country: 'United States',
      city: 'Los Angeles',
      nationality: 'US',
      bio: 'Versatile dance group performing various styles for all types of events.',
      avatar_url: null,
      is_organization: true,
      organization_name: 'Elite Dance Company',
      created_at: new Date(),
      updated_at: new Date()
    }
  ];
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const user of users) {
      const result = await client.query(
        `INSERT INTO users(
          username, email, password, name, role, status, phone, country, city, 
          nationality, bio, avatar_url, is_organization, organization_name, created_at, updated_at
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
        [
          user.username, user.email, user.password, user.name, user.role, user.status, 
          user.phone, user.country, user.city, user.nationality, user.bio, user.avatar_url,
          user.is_organization || false, user.organization_name || null, user.created_at, user.updated_at
        ]
      );
      
      const userId = result.rows[0].id;
      console.log(`Created user: ${user.username} (${user.role}) with ID: ${userId}`);
      
      // If provider, create a provider profile
      if (user.role === 'provider') {
        const isGroup = user.is_organization || false;
        const groupName = user.organization_name || null;
        
        await client.query(
          `INSERT INTO provider_profiles(
            user_id, is_group, group_name, team_size, contact_name, 
            contact_phone, current_residence, languages, rating, 
            review_count, verified, featured_provider, created_at, updated_at
          ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            userId, 
            isGroup, 
            groupName,
            isGroup ? 5 : 1, // Team size depends on if it's a group
            user.name, 
            user.phone,
            user.city,
            '{English}', // Array format for PostgreSQL
            5.0, // Default rating
            0, // No reviews initially
            true, // Verified
            Math.random() > 0.7, // 30% chance of being featured
            user.created_at, 
            user.updated_at
          ]
        );
        console.log(`Created provider profile for: ${user.username}`);
      }
    }
    
    await client.query('COMMIT');
    console.log('All users created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating users:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Main function
 */
async function checkSchema() {
  const client = await pool.connect();
  try {
    console.log('Checking database schema...');
    
    // Check users table structure
    const usersQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;
    const usersColumns = await client.query(usersQuery);
    console.log('Users table columns:', usersColumns.rows.map(row => row.column_name));
    
    // Check provider_profiles table structure
    const providerProfilesQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'provider_profiles'
      ORDER BY ordinal_position
    `;
    const providerProfilesColumns = await client.query(providerProfilesQuery);
    console.log('Provider_profiles table columns:', providerProfilesColumns.rows.map(row => row.column_name));
    
    return usersColumns.rows.map(row => row.column_name);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    // First check the schema
    const userColumns = await checkSchema();
    await cleanDatabase();
    await createUsers();
    
    console.log('Database reset complete!');
    console.log('-------------------------');
    console.log('You can now login with the following credentials:');
    console.log('Admin: username=admin, password=adminpassword');
    console.log('Customers: username=customer1/customer2/customer3, password=password123');
    console.log('Providers: username=dj_beats/photo_pro/dance_crew, password=password123');
    
  } catch (error) {
    console.error('Reset failed:', error);
  } finally {
    await pool.end();
  }
}

main();