// Create proposals table script
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Set up dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from appropriate file
const envPath = path.join(__dirname, '../environments/.dev.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`Loaded environment from: ${envPath}`);
} else {
  console.log('No environment file found, using process.env');
}

// Create PostgreSQL connection pool
const { Pool } = pg;
const pool = new Pool({
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

// Log connection parameters for debugging
console.log('Connecting to AWS RDS database with parameters:');
console.log(`Host: ${process.env.AWS_RDS_HOST}`);
console.log(`Port: ${process.env.AWS_RDS_PORT}`);
console.log(`Database: ${process.env.AWS_RDS_DATABASE}`);
console.log(`Username: ${process.env.AWS_RDS_USERNAME}`);
console.log(`Password is set: ${process.env.AWS_RDS_PASSWORD ? 'Yes' : 'No'}`);

async function main() {
  const client = await pool.connect();
  
  try {
    console.log('Starting to create proposals table...');
    
    // Create proposal_status enum if it doesn't exist
    const enumExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'proposal_status'
      );
    `);
    
    if (!enumExists.rows[0].exists) {
      console.log('Creating proposal_status enum type...');
      await client.query(`
        CREATE TYPE proposal_status AS ENUM (
          'draft', 'pending', 'accepted', 'rejected', 'expired'
        );
      `);
      console.log('Created proposal_status enum type.');
    } else {
      console.log('proposal_status enum already exists.');
    }
    
    // Create proposals table
    console.log('Creating proposals table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS proposals (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL,
        admin_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        total_price NUMERIC(10, 2) NOT NULL,
        items JSONB NOT NULL,
        status proposal_status DEFAULT 'draft',
        valid_until TIMESTAMP,
        feedback TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    
    console.log('Proposals table created successfully!');
    
  } catch (error) {
    console.error('Error creating proposals table:', error);
  } finally {
    client.release();
  }
}

main().then(() => {
  console.log('Script completed.');
  process.exit(0);
}).catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});