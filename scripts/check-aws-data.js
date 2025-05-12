#!/usr/bin/env node

// This script checks if data has been transferred to AWS RDS
import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log('Checking data in AWS RDS...');
    
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
    
    const connectionString = `postgres://${username}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
    
    // Connect to AWS RDS
    console.log('Connecting to AWS RDS database...');
    const pool = new Pool({ connectionString });
    
    try {
      // Check row counts for each table
      const tables = [
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
      
      console.log('Table row counts in AWS RDS:');
      
      for (const table of tables) {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        const count = parseInt(result.rows[0].count);
        console.log(`- ${table}: ${count} rows`);
        
        if (count > 0 && ['users', 'services', 'events'].includes(table)) {
          // Sample a few rows from important tables
          const sampleResult = await pool.query(`SELECT * FROM ${table} LIMIT 2`);
          console.log(`  Sample data from ${table}:`);
          console.log(JSON.stringify(sampleResult.rows, null, 2).substring(0, 300) + '...');
        }
      }
      
    } catch (error) {
      console.error('Error checking data in AWS RDS:', error);
      process.exit(1);
    } finally {
      await pool.end();
    }
    
  } catch (error) {
    console.error('Data check failed:', error);
    process.exit(1);
  }
}

main();