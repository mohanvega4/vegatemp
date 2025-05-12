/**
 * Migrate to New Schema Script
 * ----------------------------
 * This script:
 * 1. Creates new normalized schema tables
 * 2. Migrates existing data (if needed)
 * 3. Creates test users for all roles
 */

import dotenv from 'dotenv';
import pg from 'pg';
import { createHash, randomBytes, scryptSync } from 'crypto';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';

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

// Password hashing utility
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = scryptSync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

/**
 * Create schema based on new-schema.ts
 */
async function createNewSchema() {
  console.log('Creating new normalized schema tables...');

  try {
    // Setup enums
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'employee', 'customer', 'provider');
        EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE user_status AS ENUM ('active', 'pending', 'rejected', 'inactive');
        EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE email_verification_status AS ENUM ('pending', 'verified', 'failed', 'unverified');
        EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE event_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
        EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE proposal_status AS ENUM ('pending', 'rejected', 'draft', 'accepted', 'expired');
        EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE service_type AS ENUM ('media', 'entertainment', 'host', 'activity', 'stage', 'tent', 'food', 'retail', 'utilities', 'digital', 'special_zone');
        EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
        EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Create auth_users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS auth_users (
        id SERIAL PRIMARY KEY,
        role user_role NOT NULL,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        status user_status NOT NULL DEFAULT 'active',
        email_verification email_verification_status DEFAULT 'unverified',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        last_login TIMESTAMP
      );
    `);

    // Create admin_profiles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES auth_users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        avatar_url VARCHAR(255),
        department VARCHAR(50),
        job_title VARCHAR(50),
        bio TEXT,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create employee_profiles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employee_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES auth_users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        avatar_url VARCHAR(255),
        department VARCHAR(50),
        job_title VARCHAR(50),
        bio TEXT,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create customer_profiles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customer_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES auth_users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        avatar_url VARCHAR(255),
        company VARCHAR(100),
        address TEXT,
        city VARCHAR(50),
        country VARCHAR(50),
        preferred_contact VARCHAR(20),
        preferences JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create provider_profiles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS provider_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES auth_users(id) ON DELETE CASCADE,
        display_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        avatar_url VARCHAR(255),
        business_name VARCHAR(100),
        business_type VARCHAR(50),
        bio TEXT,
        specialty TEXT,
        years_experience INTEGER,
        website VARCHAR(255),
        social_media_links JSONB,
        address TEXT,
        city VARCHAR(50),
        country VARCHAR(50),
        availability_hours JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create events table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        value VARCHAR(100),
        description TEXT,
        event_date DATE NOT NULL,
        end_date DATE NOT NULL,
        start_time VARCHAR(20),
        end_time VARCHAR(20),
        location TEXT,
        venue VARCHAR(100),
        venue_type VARCHAR(50),
        expected_attendees INTEGER,
        status event_status DEFAULT 'pending',
        budget VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create services table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        provider_id INTEGER NOT NULL REFERENCES provider_profiles(id),
        title VARCHAR(100) NOT NULL,
        description TEXT,
        service_type service_type NOT NULL,
        service_category VARCHAR(50) NOT NULL,
        base_price VARCHAR(50),
        price_exclusions TEXT,
        is_available BOOLEAN DEFAULT TRUE,
        featured_image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create proposals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS proposals (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        employee_id INTEGER REFERENCES employee_profiles(id),
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        total_price VARCHAR(50),
        status proposal_status DEFAULT 'draft',
        items JSONB,
        valid_until DATE,
        feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create bookings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        customer_id INTEGER NOT NULL REFERENCES customer_profiles(id),
        provider_id INTEGER NOT NULL REFERENCES provider_profiles(id),
        service_id INTEGER REFERENCES services(id),
        start_date DATE NOT NULL,
        end_date DATE,
        price VARCHAR(50),
        status booking_status DEFAULT 'pending',
        special_requirements TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create portfolio_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS portfolio_items (
        id SERIAL PRIMARY KEY,
        provider_id INTEGER NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        media_url VARCHAR(255) NOT NULL,
        media_type VARCHAR(20) NOT NULL,
        featured BOOLEAN DEFAULT FALSE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create reviews table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customer_profiles(id),
        provider_id INTEGER NOT NULL REFERENCES provider_profiles(id),
        booking_id INTEGER REFERENCES bookings(id),
        rating INTEGER NOT NULL,
        comment TEXT,
        service_quality INTEGER,
        communication INTEGER,
        value_for_money INTEGER,
        published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create activities table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    console.log('Successfully created all normalized schema tables');
    return true;
  } catch (error) {
    console.error('Error creating normalized schema tables:', error.message);
    return false;
  }
}

/**
 * Create test users
 */
async function createUsers() {
  try {
    console.log('Creating test users...');
    
    // Hash passwords
    const regularPassword = await hashPassword('password123');
    const adminPassword = await hashPassword('adminpassword');
    
    // Create admin user
    const adminResult = await pool.query(`
      INSERT INTO auth_users (username, password, email, role, status)
      VALUES ('admin', $1, 'admin@vegashow.ai', 'admin', 'active')
      RETURNING id
    `, [adminPassword]);
    
    const adminId = adminResult.rows[0].id;
    console.log(`Created admin user with ID: ${adminId}`);
    
    // Create employee users
    const employeeIds = [];
    const employees = [
      { username: 'employee1', email: 'employee1@vegashow.ai' },
      { username: 'employee2', email: 'employee2@vegashow.ai' },
    ];
    
    for (const employee of employees) {
      const result = await pool.query(`
        INSERT INTO auth_users (username, password, email, role, status)
        VALUES ($1, $2, $3, 'employee', 'active')
        RETURNING id
      `, [employee.username, regularPassword, employee.email]);
      
      employeeIds.push(result.rows[0].id);
      console.log(`Created employee user with ID: ${result.rows[0].id}`);
    }
    
    // Create customer users
    const customerIds = [];
    const customers = [
      { username: 'customer1', email: 'customer1@vegashow.ai' },
      { username: 'customer2', email: 'customer2@vegashow.ai' },
      { username: 'customer3', email: 'customer3@vegashow.ai' }
    ];
    
    for (const customer of customers) {
      const result = await pool.query(`
        INSERT INTO auth_users (username, password, email, role, status)
        VALUES ($1, $2, $3, 'customer', 'active')
        RETURNING id
      `, [customer.username, regularPassword, customer.email]);
      
      customerIds.push(result.rows[0].id);
      console.log(`Created customer user with ID: ${result.rows[0].id}`);
    }
    
    // Create provider users
    const providerIds = [];
    const providers = [
      { username: 'dj_beats', email: 'dj@vegashow.ai' },
      { username: 'photo_pro', email: 'photo@vegashow.ai' },
      { username: 'dance_crew', email: 'dance@vegashow.ai' }
    ];
    
    for (const provider of providers) {
      const result = await pool.query(`
        INSERT INTO auth_users (username, password, email, role, status)
        VALUES ($1, $2, $3, 'provider', 'active')
        RETURNING id
      `, [provider.username, regularPassword, provider.email]);
      
      providerIds.push(result.rows[0].id);
      console.log(`Created provider user with ID: ${result.rows[0].id}`);
    }
    
    return {
      adminId,
      employeeIds,
      customerIds,
      providerIds
    };
  } catch (error) {
    console.error('Error creating users:', error.message);
    throw error;
  }
}

/**
 * Create profiles for each user type
 */
async function createProfiles(userIds) {
  try {
    console.log('Creating profiles for users...');
    
    // Create admin profile
    await pool.query(`
      INSERT INTO admin_profiles (user_id, name, phone, department, job_title)
      VALUES ($1, 'Admin User', '+1234567890', 'Administration', 'System Administrator')
    `, [userIds.adminId]);
    console.log('Created admin profile');
    
    // Create employee profiles
    const employeeNames = ['John Employee', 'Jane Employee'];
    const departments = ['Events', 'Customer Service'];
    const jobTitles = ['Event Coordinator', 'Support Specialist'];
    
    for (let i = 0; i < userIds.employeeIds.length; i++) {
      await pool.query(`
        INSERT INTO employee_profiles (user_id, name, phone, department, job_title)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        userIds.employeeIds[i],
        employeeNames[i],
        `+1234567${i + 10}`,
        departments[i],
        jobTitles[i]
      ]);
      console.log(`Created profile for employee ${i + 1}`);
    }
    
    // Create customer profiles
    const customerNames = ['Alice Customer', 'Bob Customer', 'Carol Customer'];
    const companies = ['Acme Corp', 'Best Events', 'Celebration Inc'];
    const cities = ['New York', 'Los Angeles', 'Chicago'];
    const countries = ['USA', 'USA', 'USA'];
    
    const customerProfileIds = [];
    
    for (let i = 0; i < userIds.customerIds.length; i++) {
      const result = await pool.query(`
        INSERT INTO customer_profiles (user_id, name, phone, company, city, country)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        userIds.customerIds[i],
        customerNames[i],
        `+1987654${i + 10}`,
        companies[i],
        cities[i],
        countries[i]
      ]);
      
      customerProfileIds.push(result.rows[0].id);
      console.log(`Created profile for customer ${i + 1}`);
    }
    
    // Create provider profiles
    const providerNames = ['DJ Beats', 'Photo Pro', 'Dance Crew'];
    const businessNames = ['Beats Entertainment', 'Perfect Moments Photography', 'Move & Groove Dancers'];
    const businessTypes = ['Entertainment', 'Media', 'Entertainment'];
    const specialties = ['Music and DJ Services', 'Event Photography', 'Choreography and Dance'];
    const cities2 = ['Miami', 'Seattle', 'Atlanta'];
    
    const providerProfileIds = [];
    
    for (let i = 0; i < userIds.providerIds.length; i++) {
      const result = await pool.query(`
        INSERT INTO provider_profiles (
          user_id, display_name, phone, business_name, business_type, 
          specialty, years_experience, city, country, bio
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [
        userIds.providerIds[i],
        providerNames[i],
        `+1567890${i + 10}`,
        businessNames[i],
        businessTypes[i],
        specialties[i],
        5 + i,
        cities2[i],
        'USA',
        `Professional ${specialties[i]} provider with ${5 + i} years of experience.`
      ]);
      
      providerProfileIds.push(result.rows[0].id);
      console.log(`Created profile for provider ${i + 1}`);
    }
    
    return {
      customerProfileIds,
      providerProfileIds
    };
  } catch (error) {
    console.error('Error creating profiles:', error.message);
    throw error;
  }
}

/**
 * Create events for customers
 */
async function createEvents(profiles) {
  try {
    console.log('Creating sample events...');
    
    const eventNames = [
      'Corporate Anniversary', 
      'Wedding Celebration', 
      'Product Launch',
      'Birthday Party',
      'Music Festival',
      'Tech Conference'
    ];
    
    const eventDescriptions = [
      'Annual corporate celebration marking company milestones',
      'Elegant wedding with reception and entertainment',
      'Launch event for new product line with media coverage',
      'Surprise birthday party with entertainment',
      'Weekend-long music festival with multiple performers',
      'Technology conference with speakers and networking'
    ];
    
    const venues = [
      'Grand Ballroom',
      'Beach Resort',
      'Convention Center',
      'Private Villa',
      'City Park',
      'Tech Hub'
    ];
    
    const venueTypes = [
      'Indoor',
      'Beach',
      'Convention',
      'Private',
      'Outdoor',
      'Conference'
    ];
    
    const budgets = [
      '$15,000-$20,000',
      '$25,000-$35,000',
      '$10,000-$15,000',
      '$5,000-$7,500',
      '$50,000-$75,000',
      '$20,000-$30,000'
    ];
    
    const attendees = [100, 150, 75, 30, 500, 200];
    const eventIds = [];
    
    // Create 2 events for each customer
    for (let i = 0; i < profiles.customerProfileIds.length; i++) {
      const customerId = profiles.customerProfileIds[i];
      
      for (let j = 0; j < 2; j++) {
        const eventIndex = i * 2 + j;
        if (eventIndex >= eventNames.length) break;
        
        // Calculate dates (future dates)
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() + 30 + (i * 15) + (j * 10));
        
        const endDate = new Date(eventDate);
        endDate.setDate(endDate.getDate() + 1 + j);
        
        const result = await pool.query(`
          INSERT INTO events (
            customer_id, name, description, event_date, end_date,
            venue, venue_type, expected_attendees, budget, status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
        `, [
          customerId,
          eventNames[eventIndex],
          eventDescriptions[eventIndex],
          eventDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          venues[eventIndex],
          venueTypes[eventIndex],
          attendees[eventIndex],
          budgets[eventIndex],
          j === 0 ? 'pending' : 'confirmed'
        ]);
        
        eventIds.push(result.rows[0].id);
        console.log(`Created event "${eventNames[eventIndex]}" for customer ${i + 1}`);
      }
    }
    
    return eventIds;
  } catch (error) {
    console.error('Error creating events:', error.message);
    throw error;
  }
}

/**
 * Create services for providers
 */
async function createServices(profiles) {
  try {
    console.log('Creating sample services...');
    
    const servicesList = [
      // DJ Services
      {
        providerId: profiles.providerProfileIds[0],
        title: 'DJ Services - Standard Package',
        description: 'Professional DJ services for your event, includes standard equipment and 4 hours of music.',
        serviceType: 'entertainment',
        serviceCategory: 'Music',
        basePrice: '$500'
      },
      {
        providerId: profiles.providerProfileIds[0],
        title: 'DJ Services - Premium Package',
        description: 'Premium DJ services with advanced lighting, sound equipment, and 6 hours of music.',
        serviceType: 'entertainment',
        serviceCategory: 'Music',
        basePrice: '$900'
      },
      
      // Photography Services
      {
        providerId: profiles.providerProfileIds[1],
        title: 'Event Photography - Basic',
        description: 'Professional event photography coverage for 3 hours, includes digital delivery of edited photos.',
        serviceType: 'media',
        serviceCategory: 'Photography',
        basePrice: '$450'
      },
      {
        providerId: profiles.providerProfileIds[1],
        title: 'Event Photography - Complete',
        description: 'Complete event photography coverage for 6 hours, includes digital delivery of all edited photos and a printed album.',
        serviceType: 'media',
        serviceCategory: 'Photography',
        basePrice: '$850'
      },
      
      // Dance Services
      {
        providerId: profiles.providerProfileIds[2],
        title: 'Dance Performance - Standard',
        description: 'A 30-minute dance performance by our professional dance crew.',
        serviceType: 'entertainment',
        serviceCategory: 'Performance',
        basePrice: '$600'
      },
      {
        providerId: profiles.providerProfileIds[2],
        title: 'Dance Workshop',
        description: 'Interactive 1-hour dance workshop for event attendees, learn the basics of popular dance styles.',
        serviceType: 'activity',
        serviceCategory: 'Workshop',
        basePrice: '$400'
      }
    ];
    
    const serviceIds = [];
    
    for (const service of servicesList) {
      const result = await pool.query(`
        INSERT INTO services (
          provider_id, title, description, service_type, 
          service_category, base_price, is_available
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        service.providerId,
        service.title,
        service.description,
        service.serviceType,
        service.serviceCategory,
        service.basePrice,
        true
      ]);
      
      serviceIds.push(result.rows[0].id);
      console.log(`Created service "${service.title}"`);
    }
    
    return serviceIds;
  } catch (error) {
    console.error('Error creating services:', error.message);
    throw error;
  }
}

/**
 * Create portfolio items for providers
 */
async function createPortfolioItems(profiles) {
  try {
    console.log('Creating sample portfolio items...');
    
    const portfolioItems = [
      // DJ Portfolio
      {
        providerId: profiles.providerProfileIds[0],
        title: 'Corporate Party DJ Set',
        description: 'DJ set for a major corporate event with 500+ attendees',
        mediaUrl: 'https://example.com/dj_corporate_event.jpg',
        mediaType: 'image'
      },
      {
        providerId: profiles.providerProfileIds[0],
        title: 'Wedding DJ Highlights',
        description: 'Highlights from a beachfront wedding DJ set',
        mediaUrl: 'https://example.com/dj_wedding.mp4',
        mediaType: 'video'
      },
      
      // Photographer Portfolio
      {
        providerId: profiles.providerProfileIds[1],
        title: 'Executive Portrait Session',
        description: 'Professional portraits for company executives',
        mediaUrl: 'https://example.com/executive_portraits.jpg',
        mediaType: 'image'
      },
      {
        providerId: profiles.providerProfileIds[1],
        title: 'Product Launch Photography',
        description: 'Photography from a major tech product launch event',
        mediaUrl: 'https://example.com/product_launch.jpg',
        mediaType: 'image'
      },
      
      // Dance Crew Portfolio
      {
        providerId: profiles.providerProfileIds[2],
        title: 'Festival Performance',
        description: 'Our crew performing at a major music festival',
        mediaUrl: 'https://example.com/dance_festival.mp4',
        mediaType: 'video'
      },
      {
        providerId: profiles.providerProfileIds[2],
        title: 'Corporate Event Dance Show',
        description: 'Custom choreographed performance for a corporate event',
        mediaUrl: 'https://example.com/corporate_dance.jpg',
        mediaType: 'image'
      }
    ];
    
    for (let i = 0; i < portfolioItems.length; i++) {
      const item = portfolioItems[i];
      await pool.query(`
        INSERT INTO portfolio_items (
          provider_id, title, description, media_url, 
          media_type, featured, sort_order
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        item.providerId,
        item.title,
        item.description,
        item.mediaUrl,
        item.mediaType,
        i % 2 === 0, // Feature every other item
        i
      ]);
      
      console.log(`Created portfolio item "${item.title}"`);
    }
    
  } catch (error) {
    console.error('Error creating portfolio items:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting migration to new schema...');
    
    // Create new schema
    const schemaCreated = await createNewSchema();
    if (!schemaCreated) {
      throw new Error('Failed to create new schema');
    }
    
    // Create users
    const userIds = await createUsers();
    
    // Create profiles for users
    const profiles = await createProfiles(userIds);
    
    // Create events
    const eventIds = await createEvents(profiles);
    
    // Create services
    const serviceIds = await createServices(profiles);
    
    // Create portfolio items
    await createPortfolioItems(profiles);
    
    console.log('Migration completed successfully!');
    console.log('\nTest Accounts:');
    console.log('- Admin: username="admin", password="adminpassword"');
    console.log('- Employees: username="employee1" or "employee2", password="password123"');
    console.log('- Customers: username="customer1", "customer2", or "customer3", password="password123"');
    console.log('- Providers: username="dj_beats", "photo_pro", or "dance_crew", password="password123"');
    
  } catch (error) {
    console.error('Error during migration:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the migration as an ES module
main();