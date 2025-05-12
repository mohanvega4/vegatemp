#!/usr/bin/env node

// This script migrates data from the current database to AWS RDS
const dotenv = require('dotenv');
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const schema = require('../shared/schema');
const { migrate } = require('drizzle-orm/node-postgres/migrator');

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log('Starting migration to AWS RDS...');
    
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
    
    // Connect to AWS RDS
    console.log('Connecting to AWS RDS database...');
    const awsPool = new Pool({ connectionString: awsConnectionString });
    const awsDb = drizzle(awsPool, { schema });
    
    try {
      // Test the connection
      await awsPool.query('SELECT NOW()');
      console.log('Successfully connected to AWS RDS database');
      
      // Push the schema to AWS RDS
      console.log('Creating database schema on AWS RDS...');
      
      // Use Drizzle's schema push to create all tables
      const { drizzle } = await import('drizzle-kit');
      await drizzle({
        schema: './shared/schema.ts',
        out: './migrations',
        dialect: 'postgresql',
        dbCredentials: {
          url: awsConnectionString,
        },
        push: true,
      });
      
      console.log('Schema migration completed successfully');
      
      // Seed initial data if needed (this step is optional)
      // Add your seeding logic here if required
      
      console.log('Migration to AWS RDS completed successfully');
    } catch (error) {
      console.error('Error connecting to AWS RDS:', error);
      process.exit(1);
    } finally {
      await awsPool.end();
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();