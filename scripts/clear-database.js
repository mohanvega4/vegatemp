/**
 * Clear Database Script
 * -------------------
 * This script will delete all data from all tables in the database
 */

// Using ES modules
import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

// Connect to the database using AWS RDS parameters
console.log('Using AWS RDS connection parameters:');
console.log(`Host: ${process.env.AWS_RDS_HOST}`);
console.log(`Port: ${process.env.AWS_RDS_PORT}`);
console.log(`Database: ${process.env.AWS_RDS_DATABASE}`);
console.log(`Username: ${process.env.AWS_RDS_USERNAME}`);
console.log(`Password is set: ${process.env.AWS_RDS_PASSWORD ? 'Yes' : 'No'}`);

const dbConfig = {
  host: process.env.AWS_RDS_HOST,
  port: parseInt(process.env.AWS_RDS_PORT || '5432'),
  database: process.env.AWS_RDS_DATABASE,
  user: process.env.AWS_RDS_USERNAME,
  password: process.env.AWS_RDS_PASSWORD,
  ssl: false, // SSL is disabled for AWS RDS as configured in parameter groups
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
};

const pool = new Pool(dbConfig);

/**
 * Clean the database by truncating all tables
 */
async function cleanDatabase() {
  console.log('Removing all data from existing tables...');
  
  const tables = [
    'activities',
    'availability',
    'bookings',
    'events',
    'messages',
    'notifications',
    'payments',
    'portfolio_items',
    'proposals',
    'provider_profiles',
    'reviews',
    'services',
    'settings',
    'users'
  ];
  
  // Disable foreign key checks
  try {
    await pool.query('SET session_replication_role = replica;');
    console.log('Disabled foreign key checks');
  } catch (error) {
    console.error('Error disabling foreign key checks:', error.message);
  }
  
  // Truncate all tables
  for (const table of tables) {
    try {
      await pool.query(`TRUNCATE TABLE "${table}" CASCADE`);
      console.log(`Cleared all data from: ${table}`);
    } catch (error) {
      console.error(`Error clearing data from ${table}:`, error.message);
    }
  }
  
  // Re-enable foreign key checks
  try {
    await pool.query('SET session_replication_role = DEFAULT;');
    console.log('Re-enabled foreign key checks');
  } catch (error) {
    console.error('Error re-enabling foreign key checks:', error.message);
  }
  
  console.log('All data has been removed from the database');
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting database cleanup...');
    
    await cleanDatabase();
    
    console.log('Database cleanup completed successfully');
    
  } catch (error) {
    console.error('Error during database cleanup:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the cleanup
main();