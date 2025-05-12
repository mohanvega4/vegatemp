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
    console.log('Creating missing provider profiles...');
    
    // Get all provider users without profiles
    const missingProfiles = await pool.query(`
      SELECT au.id, au.username, au.email
      FROM auth_users au
      LEFT JOIN provider_profiles pp ON au.id = pp.user_id
      WHERE au.role = 'provider' AND pp.id IS NULL;
    `);
    
    const userCount = missingProfiles.rows.length;
    console.log(`Found ${userCount} provider users without profiles`);
    
    if (userCount === 0) {
      console.log('No profiles need to be created. Exiting.');
      return;
    }
    
    // Create specific provider profiles with some relevant data
    const providerData = {
      'dj_beats': {
        isGroup: false,
        groupName: null,
        contactName: 'DJ Beats',
        contactPhone: '+1234567890',
        currentResidence: 'Miami, FL',
        languages: ['English', 'Spanish'],
        verified: true,
        featuredProvider: true
      },
      'photo_pro': {
        isGroup: false,
        groupName: null,
        contactName: 'Photography Professional',
        contactPhone: '+1987654321',
        currentResidence: 'New York, NY',
        languages: ['English', 'French'],
        verified: true,
        featuredProvider: false
      },
      'dance_crew': {
        isGroup: true,
        groupName: 'Urban Dance Crew',
        contactName: 'Dance Team Leader',
        contactPhone: '+1555123456',
        currentResidence: 'Los Angeles, CA',
        languages: ['English'],
        teamSize: 8,
        verified: true,
        featuredProvider: true
      }
    };
    
    // Create profiles for each provider
    for (const user of missingProfiles.rows) {
      const username = user.username;
      const userId = user.id;
      
      // Get specific data for this provider if available, otherwise use defaults
      const data = providerData[username] || {
        isGroup: false,
        groupName: null,
        contactName: username,
        contactPhone: '+1234567890',
        currentResidence: 'United States',
        languages: ['English'],
        verified: false,
        featuredProvider: false
      };
      
      // Insert the profile
      const result = await pool.query(`
        INSERT INTO provider_profiles (
          user_id, is_group, group_name, team_size, contact_name, contact_phone, current_residence, languages, 
          view_count, rating, review_count, verified, featured_provider, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, 
          $9, $10, $11, $12, $13, NOW(), NOW()
        ) RETURNING id;
      `, [
        userId, 
        data.isGroup, 
        data.groupName, 
        data.teamSize || null, 
        data.contactName, 
        data.contactPhone, 
        data.currentResidence, 
        data.languages, 
        0, // view_count
        0, // rating
        0, // review_count
        data.verified, 
        data.featuredProvider,
      ]);
      
      console.log(`Created profile for ${username} with id ${result.rows[0].id}`);
    }
    
    console.log('Successfully created provider profiles');
    
  } catch (error) {
    console.error('Error creating provider profiles:', error.message);
  } finally {
    await pool.end();
  }
}

main();