import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

// Database connection configuration using AWS RDS parameters
const dbConfig = {
  host: process.env.AWS_RDS_HOST,
  port: parseInt(process.env.AWS_RDS_PORT || '5432'),
  database: process.env.AWS_RDS_DATABASE,
  user: process.env.AWS_RDS_USERNAME,
  password: process.env.AWS_RDS_PASSWORD,
  ssl: false
};

// Connect to the database
const { Pool } = pg;
const pool = new Pool(dbConfig);

async function main() {
  try {
    console.log('Checking auth_users table...');
    
    // Check if auth_users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'auth_users'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    console.log(`auth_users table exists: ${tableExists}`);
    
    if (tableExists) {
      // Count records
      const countResult = await pool.query(`
        SELECT COUNT(*) FROM auth_users;
      `);
      console.log(`Number of records in auth_users: ${countResult.rows[0].count}`);
      
      // Get sample data
      const userSample = await pool.query(`
        SELECT id, username, role, status, email FROM auth_users LIMIT 5;
      `);
      
      console.log('Sample data from auth_users:');
      console.table(userSample.rows);
    }
    
    // Check the other profile tables
    const tablesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%profiles' 
        OR table_name IN ('events', 'services', 'proposals', 'bookings', 'portfolio_items', 'reviews', 'activities');
    `);
    
    console.log('Available related tables:');
    tablesCheck.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('Error checking database:', error.message);
  } finally {
    await pool.end();
  }
}

main();