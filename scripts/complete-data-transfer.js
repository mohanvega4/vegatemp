#!/usr/bin/env node

// This script transfers the remaining data to AWS RDS
import dotenv from 'dotenv';
import pg from 'pg';
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
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return null;
};

// Create temp directory if it doesn't exist
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Define tables that still need to be transferred
const tableNames = [
  'bookings',
  'reviews',
  'activities',
  'portfolio_items' // Re-transfer this table as it only shows 3 rows
];

async function main() {
  try {
    console.log('Starting remaining data transfer to AWS RDS...');
    
    // Connect to current database
    console.log('Connecting to current database...');
    const currentDbPool = new Pool({ connectionString: process.env.DATABASE_URL });
    
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
    
    try {
      for (const tableName of tableNames) {
        // Check if we already have this data in temp files
        const existingData = readFromFile(`${tableName}.json`);
        
        if (existingData) {
          console.log(`Using existing data for ${tableName} from temp file`);
        } else {
          // Extract data from current database
          console.log(`Fetching data from ${tableName}...`);
          // Use raw query to get all data from the table
          const result = await currentDbPool.query(`SELECT * FROM ${tableName}`);
          const data = result.rows;
          console.log(`Found ${data.length} rows in ${tableName}`);
          
          if (data.length > 0) {
            // Write to temp file
            writeToFile(data, `${tableName}.json`);
          }
        }
      }
      
      // Import data to AWS RDS
      console.log('Importing remaining data to AWS RDS...');
      
      for (const tableName of tableNames) {
        try {
          // First clear any existing data in the table to avoid conflicts
          console.log(`Clearing existing data from ${tableName} in AWS RDS...`);
          await awsPool.query(`DELETE FROM ${tableName}`);
          
          const filePath = path.join(tempDir, `${tableName}.json`);
          if (fs.existsSync(filePath)) {
            const data = readFromFile(`${tableName}.json`);
            
            if (data && data.length > 0) {
              console.log(`Importing ${data.length} rows to ${tableName}...`);
              
              // Process items in smaller batches to avoid timeouts
              const batchSize = 20;
              for (let i = 0; i < data.length; i += batchSize) {
                const batch = data.slice(i, i + batchSize);
                console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(data.length / batchSize)} for ${tableName}...`);
                
                for (const item of batch) {
                  const columns = Object.keys(item).join(', ');
                  const placeholders = Object.keys(item).map((_, i) => `$${i + 1}`).join(', ');
                  const values = Object.values(item);
                  
                  const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`;
                  await awsPool.query(query, values);
                }
              }
              
              // Verify data was imported
              const countResult = await awsPool.query(`SELECT COUNT(*) FROM ${tableName}`);
              console.log(`Now ${countResult.rows[0].count} rows in ${tableName}`);
            }
          }
        } catch (error) {
          console.warn(`Error importing data to ${tableName}:`, error.message);
          // Continue with next table
        }
      }
      
      console.log('Remaining data transfer completed');
      
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