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
    console.log('Checking provider_profiles table...');
    
    // Check the table structure
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'provider_profiles'
      ORDER BY ordinal_position;
    `);
    
    console.log('provider_profiles table structure:');
    console.table(columnsResult.rows);
    
    // Count records
    const countResult = await pool.query(`
      SELECT COUNT(*) FROM provider_profiles;
    `);
    console.log(`Number of records in provider_profiles: ${countResult.rows[0].count}`);
    
    // Get sample data
    if (parseInt(countResult.rows[0].count) > 0) {
      // Check if display_name column exists
      const hasDisplayName = columnsResult.rows.some(col => col.column_name === 'display_name');
      
      // Query sample data using the correct column name
      const nameColumn = hasDisplayName ? 'display_name' : 'name';
      
      const providerSample = await pool.query(`
        SELECT id, user_id, ${nameColumn}, business_name, business_type 
        FROM provider_profiles 
        LIMIT 5;
      `);
      
      console.log('Sample data from provider_profiles:');
      console.table(providerSample.rows);
    }
    
    // Check for providers without profiles
    const missingProfiles = await pool.query(`
      SELECT au.id, au.username, au.email
      FROM auth_users au
      LEFT JOIN provider_profiles pp ON au.id = pp.user_id
      WHERE au.role = 'provider' AND pp.id IS NULL;
    `);
    
    console.log('Providers without profiles:');
    console.table(missingProfiles.rows);
    
  } catch (error) {
    console.error('Error checking provider_profiles table:', error.message);
  } finally {
    await pool.end();
  }
}

main();