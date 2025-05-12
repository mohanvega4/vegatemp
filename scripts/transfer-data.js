#!/usr/bin/env node

// This script transfers data from the current database to AWS RDS
import dotenv from 'dotenv';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Helper function to write data to temp files
const writeToFile = (data, fileName) => {
  const filePath = path.join(process.cwd(), 'temp', fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Data written to ${filePath}`);
  return filePath;
};

// Helper function to read data from temp files
const readFromFile = (fileName) => {
  const filePath = path.join(process.cwd(), 'temp', fileName);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

// Create temp directory if it doesn't exist
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Define table names in order of dependencies (to handle foreign key constraints)
const tableNames = [
  'users',
  'provider_profiles',
  'events',
  'services',
  'availability',
  'portfolio_items',
  'bookings',
  'reviews',
  'messages',
  'activities',
  'payments',
  'notifications',
  'settings'
];

async function main() {
  try {
    console.log('Starting data transfer to AWS RDS...');
    
    // Connect to current database
    console.log('Connecting to current database...');
    const currentDbPool = new Pool({ connectionString: process.env.DATABASE_URL });
    const currentDb = drizzle(currentDbPool, { schema });
    
    // Connect to AWS RDS
    const host = process.env.AWS_RDS_HOST;
    const port = process.env.AWS_RDS_PORT;
    const database = process.env.AWS_RDS_DATABASE;
    const username = process.env.AWS_RDS_USERNAME;
    const password = process.env.AWS_RDS_PASSWORD;
    
    if (!host || !port || !database || !username || !password) {
      console.error('Error: Missing AWS RDS credentials');
      process.exit(1);
    }
    
    const awsConnectionString = `postgres://${username}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
    console.log('Connecting to AWS RDS database...');
    const awsPool = new Pool({ connectionString: awsConnectionString });
    const awsDb = drizzle(awsPool, { schema });
    
    try {
      // Extract data from current database
      console.log('Extracting data from current database...');
      
      for (const tableName of tableNames) {
        try {
          console.log(`Fetching data from ${tableName}...`);
          // Use raw query to get all data from the table
          const result = await currentDbPool.query(`SELECT * FROM ${tableName}`);
          const data = result.rows;
          console.log(`Found ${data.length} rows in ${tableName}`);
          
          if (data.length > 0) {
            // Write to temp file
            writeToFile(data, `${tableName}.json`);
          }
        } catch (error) {
          console.warn(`Error fetching data from ${tableName}:`, error.message);
          // Continue with next table
        }
      }
      
      console.log('Data extraction completed');
      
      // Import data to AWS RDS
      console.log('Importing data to AWS RDS...');
      
      for (const tableName of tableNames) {
        try {
          const filePath = path.join(tempDir, `${tableName}.json`);
          if (fs.existsSync(filePath)) {
            const data = readFromFile(`${tableName}.json`);
            
            if (data.length > 0) {
              console.log(`Importing ${data.length} rows to ${tableName}...`);
              
              // For each item, insert it using raw query to preserve IDs
              for (const item of data) {
                const columns = Object.keys(item).join(', ');
                const values = Object.values(item).map(value => 
                  value === null ? 'NULL' : 
                  typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : 
                  value
                ).join(', ');
                
                const query = `INSERT INTO ${tableName} (${columns}) VALUES (${values}) ON CONFLICT DO NOTHING`;
                await awsPool.query(query);
              }
              
              console.log(`Successfully imported data to ${tableName}`);
            }
          }
        } catch (error) {
          console.warn(`Error importing data to ${tableName}:`, error.message);
          // Continue with next table
        }
      }
      
      console.log('Data import completed');
      console.log('Data transfer to AWS RDS completed successfully');
      
    } catch (error) {
      console.error('Error during data transfer:', error);
      process.exit(1);
    } finally {
      await currentDbPool.end();
      await awsPool.end();
      console.log('Database connections closed');
    }
    
  } catch (error) {
    console.error('Data transfer failed:', error);
    process.exit(1);
  }
}

main();