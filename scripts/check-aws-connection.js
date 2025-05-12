#!/usr/bin/env node

/**
 * AWS RDS Connection Verification Script
 * -------------------------------------
 * This script tests the connection to the AWS RDS database,
 * verifies tables, and checks overall database status.
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if AWS RDS environment variables are set
const requiredEnvVars = [
  'AWS_RDS_HOST',
  'AWS_RDS_DATABASE',
  'AWS_RDS_USERNAME',
  'AWS_RDS_PASSWORD'
];

// Try to load environment variables from appropriate files
function loadEnvironmentVariables() {
  // Check for environment files in environments directory
  const envDir = path.join(__dirname, '..', 'environments');
  const envFiles = ['.dev.env', '.local.env', '.prod.env'].filter(file => 
    fs.existsSync(path.join(envDir, file))
  );
  
  // Try each environment file
  for (const file of envFiles) {
    const envPath = path.join(envDir, file);
    console.log(`Trying to load environment variables from ${envPath}`);
    
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      console.log(`Successfully loaded environment from ${envPath}`);
      break;
    }
  }
}

// If any required environment variables are missing, try to load them
const missingVars = requiredEnvVars.filter(name => !process.env[name]);
if (missingVars.length > 0) {
  console.log(`Missing environment variables: ${missingVars.join(', ')}`);
  loadEnvironmentVariables();
}

// Function to validate AWS RDS environment variables
function validateAwsRdsEnvVars() {
  let missingVars = [];
  
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.error(`Error: Missing required AWS RDS environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  return true;
}

// Create database connection configuration
function createDbConfig() {
  return {
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
}

// Test database connection
async function testConnection() {
  if (!validateAwsRdsEnvVars()) {
    process.exit(1);
  }
  
  const dbConfig = createDbConfig();
  
  // Log connection parameters for debugging (without printing sensitive info)
  console.log('\n======= AWS RDS CONNECTION CHECK =======');
  console.log(`Host: ${dbConfig.host}`);
  console.log(`Port: ${dbConfig.port}`);
  console.log(`Database: ${dbConfig.database}`);
  console.log(`Username: ${dbConfig.user}`);
  console.log(`Password is set: ${dbConfig.password ? 'Yes' : 'No'}`);
  
  // Create connection pool
  const pool = new Pool(dbConfig);
  
  try {
    // Test connection
    console.log('\nTesting connection...');
    const connResult = await pool.query('SELECT NOW()');
    console.log(`Connection successful! Server time: ${connResult.rows[0].now}`);
    
    // Get database size
    console.log('\nChecking database size...');
    const sizeResult = await pool.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as db_size
    `);
    console.log(`Database size: ${sizeResult.rows[0].db_size}`);
    
    // List all tables
    console.log('\nListing tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('No tables found in the database.');
    } else {
      console.log(`Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.table_name}`);
      });
    }
    
    // Check database users
    console.log('\nChecking database users...');
    const usersResult = await pool.query(`
      SELECT usename, usesuper, usecreatedb
      FROM pg_user
      ORDER BY usename
    `);
    
    console.log(`Database users:`);
    usersResult.rows.forEach(user => {
      console.log(`  - ${user.usename} (Superuser: ${user.usesuper ? 'Yes' : 'No'}, Can create DB: ${user.usecreatedb ? 'Yes' : 'No'})`);
    });
    
    // Check database connection count
    console.log('\nChecking active connections...');
    const connectionsResult = await pool.query(`
      SELECT count(*) as connection_count
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);
    
    console.log(`Active connections: ${connectionsResult.rows[0].connection_count}`);
    
    console.log('\n✅ AWS RDS database connection check completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error connecting to AWS RDS database:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Execute the test
testConnection().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});