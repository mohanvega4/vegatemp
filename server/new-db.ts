/**
 * Vega Show Platform - New Normalized Database Connection
 * ------------------------------------------------------
 * Provides database connection for the new normalized schema
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/new-schema";

/**
 * AWS RDS PostgreSQL Database Connection
 * ======================================
 * This application exclusively uses AWS RDS PostgreSQL.
 * Connection details are loaded from environment variables.
 */

// Creating database connection configuration
const dbConfig = {
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
};

// Log connection parameters for debugging (without printing sensitive info)
console.log('Connecting to AWS RDS database with normalized schema...');
console.log(`Host: ${dbConfig.host}`);
console.log(`Port: ${dbConfig.port}`);
console.log(`Database: ${dbConfig.database}`);
console.log(`Username: ${dbConfig.user}`);
console.log(`Password is set: ${dbConfig.password ? 'Yes' : 'No'}`);

// Create connection pool with the connection parameters
export const pool = new Pool(dbConfig);

// Initialize the Drizzle ORM with the new schema
export const db = drizzle(pool, { schema });

// Test the connection and report status
export async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Successfully connected to AWS RDS database at:', res.rows[0].now);
    return true;
  } catch (error) {
    console.error('Error testing AWS RDS database connection:', error instanceof Error ? error.message : String(error));
    console.error('Database is required for application to function properly.');
    console.error('Please verify the AWS RDS instance is running and accessible.');
    
    // Exit the application if critical and cannot connect to database in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Exiting application due to database connection failure in production mode.');
      process.exit(1);
    }
    return false;
  }
}