#!/usr/bin/env node

// This script transfers the remaining portfolio items and activities to AWS RDS
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

// Helper function to read data from temp files
const readFromFile = (fileName) => {
  const filePath = path.join(process.cwd(), 'temp', fileName);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return null;
};

// Define tables that still need to be transferred
const tableNames = [
  'portfolio_items',
  'activities'
];

async function main() {
  try {
    console.log('Starting transfer of remaining portfolio items and activities...');
    
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
        try {
          // Clear existing data for specific table
          console.log(`Clearing existing data from ${tableName} in AWS RDS...`);
          await awsPool.query(`DELETE FROM ${tableName}`);
          
          // Read data from temp file
          const data = readFromFile(`${tableName}.json`);
          
          if (data && data.length > 0) {
            console.log(`Transferring ${data.length} rows to ${tableName}...`);
            
            // Smaller batch size for activities table
            const batchSize = tableName === 'activities' ? 10 : 20;
            const totalBatches = Math.ceil(data.length / batchSize);
            
            for (let i = 0; i < data.length; i += batchSize) {
              const batch = data.slice(i, i + batchSize);
              console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${totalBatches} for ${tableName}...`);
              
              // Process items in smaller chunks
              for (const item of batch) {
                try {
                  const columns = Object.keys(item).join(', ');
                  const placeholders = Object.keys(item).map((_, i) => `$${i + 1}`).join(', ');
                  const values = Object.values(item);
                  
                  const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`;
                  await awsPool.query(query, values);
                } catch (itemError) {
                  console.warn(`Error inserting item into ${tableName}:`, itemError.message);
                  // Continue with next item
                }
              }
              
              // Verify progress
              const countResult = await awsPool.query(`SELECT COUNT(*) FROM ${tableName}`);
              console.log(`Progress: ${countResult.rows[0].count} rows in ${tableName}`);
            }
            
            // Verify final row count
            const finalCount = await awsPool.query(`SELECT COUNT(*) FROM ${tableName}`);
            console.log(`Completed: ${finalCount.rows[0].count} rows in ${tableName}`);
          } else {
            console.log(`No data found for ${tableName}`);
          }
        } catch (tableError) {
          console.warn(`Error processing table ${tableName}:`, tableError.message);
          // Continue with next table
        }
      }
      
      console.log('Transfer of remaining data completed');
      
    } catch (error) {
      console.error('Error during data transfer:', error);
      process.exit(1);
    } finally {
      await awsPool.end();
      console.log('Database connection closed');
    }
    
  } catch (error) {
    console.error('Data transfer failed:', error);
    process.exit(1);
  }
}

main();