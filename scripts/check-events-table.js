import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

// Database connection configuration
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
    console.log('Checking events table structure...');
    
    // Get table structure
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, column_default
      FROM information_schema.columns
      WHERE table_name = 'events'
      ORDER BY ordinal_position;
    `);
    
    console.log('Events table structure:');
    console.table(columnsResult.rows);
    
    // Count records
    const countResult = await pool.query(`
      SELECT COUNT(*) FROM events;
    `);
    console.log(`Number of records in events: ${countResult.rows[0].count}`);
    
    // Get sample data if records exist
    if (parseInt(countResult.rows[0].count) > 0) {
      const eventSample = await pool.query(`
        SELECT * FROM events LIMIT 2;
      `);
      
      console.log('Sample data from events:');
      console.table(eventSample.rows);
    }
    
  } catch (error) {
    console.error('Error checking events table:', error.message);
  } finally {
    await pool.end();
  }
}

main();