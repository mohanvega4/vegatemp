import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

// Database connection configuration using AWS RDS parameters
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
    console.log('Checking database structure...');
    
    // List all tables with a count of rows
    const tablesResult = await pool.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count,
        (
          SELECT reltuples::bigint 
          FROM pg_class 
          WHERE oid = (quote_ident(t.table_name)::regclass)
        ) AS estimated_row_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('Tables in the database:');
    console.table(tablesResult.rows);
    
    // Check auth_users structure
    const authUsersColumns = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'auth_users'
      ORDER BY ordinal_position;
    `);
    
    console.log('auth_users table structure:');
    console.table(authUsersColumns.rows);
    
    // Check if all required tables for normalized schema exist
    const requiredTables = [
      'auth_users', 'admin_profiles', 'employee_profiles', 
      'customer_profiles', 'provider_profiles', 'events', 
      'services', 'proposals', 'bookings', 'portfolio_items', 
      'reviews', 'activities'
    ];
    
    const missingTables = requiredTables.filter(table => 
      !tablesResult.rows.some(row => row.table_name === table)
    );
    
    if (missingTables.length > 0) {
      console.log('Missing tables for normalized schema:');
      console.log(missingTables.join(', '));
    } else {
      console.log('All required tables for normalized schema exist.');
    }
    
    // Check for existing profile tables
    for (const profileTable of ['admin_profiles', 'employee_profiles', 'customer_profiles']) {
      if (tablesResult.rows.some(row => row.table_name === profileTable)) {
        const profileColumns = await pool.query(`
          SELECT column_name, data_type, character_maximum_length
          FROM information_schema.columns
          WHERE table_name = '${profileTable}'
          ORDER BY ordinal_position;
        `);
        
        console.log(`${profileTable} table structure:`);
        console.table(profileColumns.rows);
      }
    }
    
  } catch (error) {
    console.error('Error checking database structure:', error.message);
  } finally {
    await pool.end();
  }
}

main();