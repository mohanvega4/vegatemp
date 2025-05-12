import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

/**
 * AWS RDS PostgreSQL Database Connection
 * ======================================
 * This application exclusively uses AWS RDS PostgreSQL.
 * Connection details are loaded from environment variables.
 */

// Log all the connection parameters for debugging (without printing sensitive info)
console.log('Attempting to connect to AWS RDS database with explicit parameters...');
console.log(`Host: ${process.env.AWS_RDS_HOST}`);
console.log(`Port: ${process.env.AWS_RDS_PORT}`);
console.log(`Database: ${process.env.AWS_RDS_DATABASE}`);
console.log(`Username: ${process.env.AWS_RDS_USERNAME}`);
console.log(`Password is set: ${process.env.AWS_RDS_PASSWORD ? 'Yes' : 'No'}`);

// Create connection pool with the connection parameters
export const pool = new Pool({
  host: process.env.AWS_RDS_HOST,
  port: parseInt(process.env.AWS_RDS_PORT || '5432'),
  database: process.env.AWS_RDS_DATABASE,
  user: process.env.AWS_RDS_USERNAME,
  password: process.env.AWS_RDS_PASSWORD,
  // SSL is disabled for AWS RDS as configured in parameter groups
  ssl: false,
  // Set longer timeouts for AWS connections
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});

// Initialize the Drizzle ORM
export const db = drizzle(pool, { schema });

// Test the connection and report status
(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Successfully connected to AWS RDS database at:', res.rows[0].now);
  } catch (err: any) {
    console.error('Error testing AWS RDS database connection:', err.message);
    console.error('Database is required for application to function properly.');
    console.error('Please verify the AWS RDS instance is running and accessible.');
    
    // Exit the application if critical and cannot connect to database in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Exiting application due to database connection failure in production mode.');
      process.exit(1);
    }
  }
})();

console.log('AWS RDS database connection initialized');