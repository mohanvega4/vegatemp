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
    console.log('Checking provider users and profiles...');
    
    // Find all provider users
    const providerUsers = await pool.query(`
      SELECT id, username, email, status, created_at
      FROM auth_users
      WHERE role = 'provider'
      ORDER BY id;
    `);
    
    console.log(`Found ${providerUsers.rows.length} provider users:`);
    console.table(providerUsers.rows);
    
    // Check if these users have provider profiles
    if (providerUsers.rows.length > 0) {
      const userIds = providerUsers.rows.map(user => user.id);
      
      const profiles = await pool.query(`
        SELECT id, user_id, is_group, group_name, contact_name
        FROM provider_profiles
        WHERE user_id IN (${userIds.join(',')})
        ORDER BY user_id;
      `);
      
      console.log(`Found ${profiles.rows.length} provider profiles:`);
      console.table(profiles.rows);
      
      // Find missing profiles
      const profileUserIds = profiles.rows.map(profile => profile.user_id);
      const missingProfileUserIds = userIds.filter(id => !profileUserIds.includes(id));
      
      if (missingProfileUserIds.length > 0) {
        console.log(`Missing profiles for ${missingProfileUserIds.length} provider users:`);
        const missingUsers = providerUsers.rows.filter(user => missingProfileUserIds.includes(user.id));
        console.table(missingUsers);
        
        // Generate SQL to create missing profiles
        console.log('\nSQL to create missing profiles:');
        for (const userId of missingProfileUserIds) {
          const user = providerUsers.rows.find(u => u.id === userId);
          console.log(`
INSERT INTO provider_profiles (
  user_id, is_group, group_name, contact_name, contact_phone, current_residence, languages, 
  view_count, rating, review_count, verified, featured_provider, created_at, updated_at
) VALUES (
  ${userId}, false, NULL, '${user.username}', '+1234567890', 'United States', ARRAY['English'], 
  0, 0, 0, false, false, NOW(), NOW()
);`);
        }
      } else {
        console.log('All provider users have profiles!');
      }
    }
    
  } catch (error) {
    console.error('Error checking provider users and profiles:', error.message);
  } finally {
    await pool.end();
  }
}

main();