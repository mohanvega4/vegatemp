#!/usr/bin/env node

// This script creates the schema in the AWS RDS database
import dotenv from 'dotenv';
import pg from 'pg';
import { execSync } from 'child_process';
const { Pool } = pg;

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log('Starting schema creation in AWS RDS...');
    
    // Construct AWS RDS connection string
    const host = process.env.AWS_RDS_HOST;
    const port = process.env.AWS_RDS_PORT;
    const database = process.env.AWS_RDS_DATABASE;
    const username = process.env.AWS_RDS_USERNAME;
    const password = process.env.AWS_RDS_PASSWORD;
    
    if (!host || !port || !database || !username || !password) {
      console.error('Error: Missing AWS RDS credentials');
      console.error('Ensure you have set AWS_RDS_HOST, AWS_RDS_PORT, AWS_RDS_DATABASE, AWS_RDS_USERNAME, and AWS_RDS_PASSWORD');
      process.exit(1);
    }
    
    const awsConnectionString = `postgres://${username}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
    
    // Set DATABASE_URL for drizzle-kit
    process.env.DATABASE_URL = awsConnectionString;
    console.log('DATABASE_URL set for drizzle-kit');
    
    try {
      // Use drizzle-kit to push the schema
      console.log('Using drizzle-kit to push schema to AWS RDS...');
      
      // Run drizzle-kit
      console.log('Running: npx drizzle-kit push');
      
      // Execute drizzle-kit push
      const output = execSync('npx drizzle-kit push', { 
        encoding: 'utf8',
        env: { ...process.env, DATABASE_URL: awsConnectionString }
      });
      
      console.log(output);
      console.log('Schema successfully pushed to AWS RDS');
    } catch (error) {
      console.error('Error pushing schema to AWS RDS:', error.message);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Schema creation failed:', error);
    process.exit(1);
  }
}

main();