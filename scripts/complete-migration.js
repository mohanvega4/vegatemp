import dotenv from 'dotenv';
import pg from 'pg';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

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

const scryptAsync = promisify(scrypt);

/**
 * Hash a password for secure storage
 */
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

/**
 * Check if a table exists
 */
async function tableExists(tableName) {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = $1
    );
  `, [tableName]);
  
  return result.rows[0].exists;
}

/**
 * Check if all required tables exist, returns list of missing tables
 */
async function checkRequiredTables() {
  const requiredTables = [
    'auth_users', 'admin_profiles', 'employee_profiles', 
    'customer_profiles', 'provider_profiles', 'events', 
    'services', 'proposals', 'bookings', 'portfolio_items', 
    'reviews', 'activities'
  ];
  
  const missingTables = [];
  
  for (const table of requiredTables) {
    if (!(await tableExists(table))) {
      missingTables.push(table);
    }
  }
  
  return missingTables;
}

/**
 * Create profile tables if they don't exist
 */
async function createProfileTables() {
  // Admin profiles
  if (!(await tableExists('admin_profiles'))) {
    console.log('Creating admin_profiles table...');
    await pool.query(`
      CREATE TABLE admin_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        avatar_url VARCHAR(255),
        department VARCHAR(50),
        job_title VARCHAR(50),
        bio TEXT,
        address TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  
  // Employee profiles
  if (!(await tableExists('employee_profiles'))) {
    console.log('Creating employee_profiles table...');
    await pool.query(`
      CREATE TABLE employee_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        avatar_url VARCHAR(255),
        department VARCHAR(50),
        job_title VARCHAR(50),
        bio TEXT,
        address TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  
  // Customer profiles
  if (!(await tableExists('customer_profiles'))) {
    console.log('Creating customer_profiles table...');
    await pool.query(`
      CREATE TABLE customer_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        avatar_url VARCHAR(255),
        company VARCHAR(100),
        address TEXT,
        city VARCHAR(50),
        country VARCHAR(50),
        preferred_contact VARCHAR(20),
        preferences JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  
  // Provider profiles
  if (!(await tableExists('provider_profiles'))) {
    console.log('Creating provider_profiles table...');
    await pool.query(`
      CREATE TABLE provider_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE NOT NULL UNIQUE,
        is_group BOOLEAN DEFAULT FALSE,
        group_name TEXT,
        team_size INTEGER,
        contact_name TEXT,
        contact_phone TEXT,
        current_residence TEXT,
        languages TEXT[],
        view_count INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        verified BOOLEAN DEFAULT FALSE,
        featured_provider BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
}

/**
 * Create admin user and admin profile if they don't exist
 */
async function createAdminUserAndProfile() {
  // Check if admin user exists
  const adminUser = await pool.query(`
    SELECT id FROM auth_users WHERE username = 'admin' AND role = 'admin';
  `);
  
  let adminId;
  
  if (adminUser.rows.length === 0) {
    console.log('Creating admin user...');
    
    // Create admin user
    const hashedPassword = await hashPassword('adminpassword');
    const newAdmin = await pool.query(`
      INSERT INTO auth_users (username, password, email, role, status, created_at, updated_at)
      VALUES ('admin', $1, 'admin@vegashow.ai', 'admin', 'active', NOW(), NOW())
      RETURNING id;
    `, [hashedPassword]);
    
    adminId = newAdmin.rows[0].id;
    console.log(`Created admin user with id ${adminId}`);
  } else {
    adminId = adminUser.rows[0].id;
    console.log(`Admin user already exists with id ${adminId}`);
  }
  
  // Check if admin profile exists
  const adminProfile = await pool.query(`
    SELECT id FROM admin_profiles WHERE user_id = $1;
  `, [adminId]);
  
  if (adminProfile.rows.length === 0) {
    console.log('Creating admin profile...');
    
    // Create admin profile
    const newProfile = await pool.query(`
      INSERT INTO admin_profiles (user_id, name, phone, avatar_url, department, job_title, created_at, updated_at)
      VALUES ($1, 'Admin User', '+1234567890', '/images/avatars/admin-avatar.jpg', 'Management', 'System Administrator', NOW(), NOW())
      RETURNING id;
    `, [adminId]);
    
    console.log(`Created admin profile with id ${newProfile.rows[0].id}`);
  } else {
    console.log(`Admin profile already exists with id ${adminProfile.rows[0].id}`);
  }
}

/**
 * Create employee users and profiles
 */
async function createEmployeeUsersAndProfiles() {
  const employees = [
    {
      username: 'employee1',
      email: 'employee1@vegashow.ai',
      name: 'Employee One',
      department: 'Events',
      jobTitle: 'Event Coordinator'
    },
    {
      username: 'employee2',
      email: 'employee2@vegashow.ai',
      name: 'Employee Two',
      department: 'Marketing',
      jobTitle: 'Marketing Specialist'
    }
  ];
  
  for (const employee of employees) {
    // Check if employee user exists
    const existingUser = await pool.query(`
      SELECT id FROM auth_users WHERE username = $1 AND role = 'employee';
    `, [employee.username]);
    
    let userId;
    
    if (existingUser.rows.length === 0) {
      console.log(`Creating employee user ${employee.username}...`);
      
      // Create employee user
      const hashedPassword = await hashPassword('password123');
      const newUser = await pool.query(`
        INSERT INTO auth_users (username, password, email, role, status, created_at, updated_at)
        VALUES ($1, $2, $3, 'employee', 'active', NOW(), NOW())
        RETURNING id;
      `, [employee.username, hashedPassword, employee.email]);
      
      userId = newUser.rows[0].id;
      console.log(`Created employee user ${employee.username} with id ${userId}`);
    } else {
      userId = existingUser.rows[0].id;
      console.log(`Employee user ${employee.username} already exists with id ${userId}`);
    }
    
    // Check if employee profile exists
    const existingProfile = await pool.query(`
      SELECT id FROM employee_profiles WHERE user_id = $1;
    `, [userId]);
    
    if (existingProfile.rows.length === 0) {
      console.log(`Creating employee profile for ${employee.username}...`);
      
      // Create employee profile
      const newProfile = await pool.query(`
        INSERT INTO employee_profiles (
          user_id, name, phone, avatar_url, department, job_title, created_at, updated_at
        )
        VALUES (
          $1, $2, '+1234567890', '/images/avatars/employee-avatar.jpg', $3, $4, NOW(), NOW()
        )
        RETURNING id;
      `, [userId, employee.name, employee.department, employee.jobTitle]);
      
      console.log(`Created employee profile for ${employee.username} with id ${newProfile.rows[0].id}`);
    } else {
      console.log(`Employee profile for ${employee.username} already exists with id ${existingProfile.rows[0].id}`);
    }
  }
}

/**
 * Create customer users and profiles
 */
async function createCustomerUsersAndProfiles() {
  const customers = [
    {
      username: 'customer1',
      email: 'customer1@vegashow.ai',
      name: 'Customer One',
      company: 'Company One Inc.',
      city: 'New York',
      country: 'USA'
    },
    {
      username: 'customer2',
      email: 'customer2@vegashow.ai',
      name: 'Customer Two',
      company: 'Company Two LLC',
      city: 'Los Angeles',
      country: 'USA'
    },
    {
      username: 'customer3',
      email: 'customer3@vegashow.ai',
      name: 'Customer Three',
      company: 'Company Three GmbH',
      city: 'Berlin',
      country: 'Germany'
    }
  ];
  
  for (const customer of customers) {
    // Check if customer user exists
    const existingUser = await pool.query(`
      SELECT id FROM auth_users WHERE username = $1 AND role = 'customer';
    `, [customer.username]);
    
    let userId;
    
    if (existingUser.rows.length === 0) {
      console.log(`Creating customer user ${customer.username}...`);
      
      // Create customer user
      const hashedPassword = await hashPassword('password123');
      const newUser = await pool.query(`
        INSERT INTO auth_users (username, password, email, role, status, created_at, updated_at)
        VALUES ($1, $2, $3, 'customer', 'active', NOW(), NOW())
        RETURNING id;
      `, [customer.username, hashedPassword, customer.email]);
      
      userId = newUser.rows[0].id;
      console.log(`Created customer user ${customer.username} with id ${userId}`);
    } else {
      userId = existingUser.rows[0].id;
      console.log(`Customer user ${customer.username} already exists with id ${userId}`);
    }
    
    // Check if customer profile exists
    const existingProfile = await pool.query(`
      SELECT id FROM customer_profiles WHERE user_id = $1;
    `, [userId]);
    
    if (existingProfile.rows.length === 0) {
      console.log(`Creating customer profile for ${customer.username}...`);
      
      // Create customer profile
      const preferences = { notifications: true, theme: 'light' };
      
      const newProfile = await pool.query(`
        INSERT INTO customer_profiles (
          user_id, name, phone, avatar_url, company, address, city, country, 
          preferred_contact, preferences, created_at, updated_at
        )
        VALUES (
          $1, $2, '+1234567890', '/images/avatars/customer-avatar.jpg', $3, 
          '123 Main St', $4, $5, 'email', $6, NOW(), NOW()
        )
        RETURNING id;
      `, [userId, customer.name, customer.company, customer.city, customer.country, JSON.stringify(preferences)]);
      
      console.log(`Created customer profile for ${customer.username} with id ${newProfile.rows[0].id}`);
    } else {
      console.log(`Customer profile for ${customer.username} already exists with id ${existingProfile.rows[0].id}`);
    }
  }
}

/**
 * Create provider users and profiles
 */
async function createProviderUsersAndProfiles() {
  const providers = [
    {
      username: 'dj_beats',
      email: 'dj@vegashow.ai',
      contactName: 'DJ Beats',
      isGroup: false,
      groupName: null,
      teamSize: null,
      contactPhone: '+1234567890',
      currentResidence: 'Miami, FL',
      languages: ['English', 'Spanish'],
      verified: true,
      featuredProvider: true
    },
    {
      username: 'photo_pro',
      email: 'photo@vegashow.ai',
      contactName: 'Photography Professional',
      isGroup: false,
      groupName: null,
      teamSize: null,
      contactPhone: '+1987654321',
      currentResidence: 'New York, NY',
      languages: ['English', 'French'],
      verified: true,
      featuredProvider: false
    },
    {
      username: 'dance_crew',
      email: 'dance@vegashow.ai',
      contactName: 'Dance Team Leader',
      isGroup: true,
      groupName: 'Urban Dance Crew',
      teamSize: 8,
      contactPhone: '+1555123456',
      currentResidence: 'Los Angeles, CA',
      languages: ['English'],
      verified: true,
      featuredProvider: true
    }
  ];
  
  for (const provider of providers) {
    // Check if provider user exists
    const existingUser = await pool.query(`
      SELECT id FROM auth_users WHERE username = $1 AND role = 'provider';
    `, [provider.username]);
    
    let userId;
    
    if (existingUser.rows.length === 0) {
      console.log(`Creating provider user ${provider.username}...`);
      
      // Create provider user
      const hashedPassword = await hashPassword('password123');
      const newUser = await pool.query(`
        INSERT INTO auth_users (username, password, email, role, status, created_at, updated_at)
        VALUES ($1, $2, $3, 'provider', 'active', NOW(), NOW())
        RETURNING id;
      `, [provider.username, hashedPassword, provider.email]);
      
      userId = newUser.rows[0].id;
      console.log(`Created provider user ${provider.username} with id ${userId}`);
    } else {
      userId = existingUser.rows[0].id;
      console.log(`Provider user ${provider.username} already exists with id ${userId}`);
    }
    
    // Check if provider profile exists
    const existingProfile = await pool.query(`
      SELECT id FROM provider_profiles WHERE user_id = $1;
    `, [userId]);
    
    if (existingProfile.rows.length === 0) {
      console.log(`Creating provider profile for ${provider.username}...`);
      
      // Create provider profile
      const newProfile = await pool.query(`
        INSERT INTO provider_profiles (
          user_id, is_group, group_name, team_size, contact_name, contact_phone, 
          current_residence, languages, view_count, rating, review_count, 
          verified, featured_provider, created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, 0, 0, 0, $9, $10, NOW(), NOW()
        )
        RETURNING id;
      `, [
        userId, 
        provider.isGroup, 
        provider.groupName, 
        provider.teamSize, 
        provider.contactName, 
        provider.contactPhone, 
        provider.currentResidence, 
        provider.languages, 
        provider.verified, 
        provider.featuredProvider
      ]);
      
      console.log(`Created provider profile for ${provider.username} with id ${newProfile.rows[0].id}`);
    } else {
      console.log(`Provider profile for ${provider.username} already exists with id ${existingProfile.rows[0].id}`);
    }
  }
}

/**
 * Create sample events for customers
 */
async function createSampleEvents() {
  // Get customer profile IDs
  const customerProfiles = await pool.query(`
    SELECT id, user_id FROM customer_profiles;
  `);
  
  if (customerProfiles.rows.length === 0) {
    console.log('No customer profiles found. Skipping event creation.');
    return;
  }
  
  // Check if we already have events
  const existingEvents = await pool.query(`
    SELECT COUNT(*) FROM events;
  `);
  
  if (parseInt(existingEvents.rows[0].count) > 0) {
    console.log(`${existingEvents.rows[0].count} events already exist. Skipping event creation.`);
    return;
  }
  
  console.log('Creating sample events...');
  
  const events = [
    {
      name: 'Corporate Annual Party',
      description: 'Annual celebration for employees and stakeholders',
      eventDate: '2025-07-15 18:00:00',
      endDate: '2025-07-15 23:00:00',
      startTime: '18:00',
      endTime: '23:00',
      location: 'Grand Hotel, Downtown',
      locationType: 'indoor',
      eventType: 'business',
      vibe: 'formal',
      expectedAttendees: 150,
      status: 'confirmed',
      budget: 15000
    },
    {
      name: 'Product Launch Event',
      description: 'Launching our new flagship product line',
      eventDate: '2025-08-10 14:00:00',
      endDate: '2025-08-10 20:00:00',
      startTime: '14:00',
      endTime: '20:00',
      location: 'Tech Convention Center',
      locationType: 'indoor',
      eventType: 'business',
      vibe: 'corporate',
      expectedAttendees: 300,
      status: 'pending',
      budget: 25000
    },
    {
      name: 'Summer Music Festival',
      description: 'Three-day music event featuring local and international artists',
      eventDate: '2025-06-20 12:00:00',
      endDate: '2025-06-22 00:00:00',
      startTime: '12:00',
      endTime: '00:00',
      location: 'Riverside Park',
      locationType: 'outdoor',
      eventType: 'entertainment',
      vibe: 'festive',
      expectedAttendees: 5000,
      status: 'in_progress',
      budget: 100000
    },
    {
      name: 'Team Building Retreat',
      description: 'Two-day corporate retreat for team bonding and strategy',
      eventDate: '2025-09-05 09:00:00',
      endDate: '2025-09-06 17:00:00',
      startTime: '09:00',
      endTime: '17:00',
      location: 'Mountain Resort',
      locationType: 'hybrid',
      eventType: 'business',
      vibe: 'corporate',
      expectedAttendees: 50,
      status: 'confirmed',
      budget: 12000
    }
  ];
  
  // Distribute events among customers
  for (let i = 0; i < events.length; i++) {
    const customerProfile = customerProfiles.rows[i % customerProfiles.rows.length];
    const event = events[i];
    
    const newEvent = await pool.query(`
      INSERT INTO events (
        customer_id, name, description, event_date, end_date, start_time, end_time,
        location, location_type, event_type, vibe, audience_size, status, budget, created_at, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
      )
      RETURNING id;
    `, [
      customerProfile.id,
      event.name,
      event.description,
      event.eventDate,
      event.endDate,
      event.startTime,
      event.endTime,
      event.location,
      event.locationType,
      event.eventType,
      event.vibe,
      event.expectedAttendees,
      event.status,
      event.budget
    ]);
    
    console.log(`Created event "${event.name}" with id ${newEvent.rows[0].id} for customer ${customerProfile.id}`);
  }
}

/**
 * Create sample services for providers
 */
async function createSampleServices() {
  // Get provider profile IDs
  const providerProfiles = await pool.query(`
    SELECT id, user_id, contact_name FROM provider_profiles;
  `);
  
  if (providerProfiles.rows.length === 0) {
    console.log('No provider profiles found. Skipping service creation.');
    return;
  }
  
  // Check if we already have services
  const existingServices = await pool.query(`
    SELECT COUNT(*) FROM services;
  `);
  
  if (parseInt(existingServices.rows[0].count) > 0) {
    console.log(`${existingServices.rows[0].count} services already exist. Skipping service creation.`);
    return;
  }
  
  console.log('Creating sample services...');
  
  const servicesByProvider = {
    'dj_beats': [
      {
        title: 'DJ Services - Standard Package',
        description: 'Professional DJ services for your event with standard equipment setup',
        serviceType: 'entertainment',
        serviceCategory: 'Music',
        basePrice: '$500',
        priceExclusions: 'Custom song requests, extended hours'
      },
      {
        title: 'DJ Services - Premium Package',
        description: 'Top-tier DJ services with premium sound system and lighting effects',
        serviceType: 'entertainment',
        serviceCategory: 'Music',
        basePrice: '$1000',
        priceExclusions: 'Special equipment, venue setup fees'
      }
    ],
    'photo_pro': [
      {
        title: 'Event Photography - Basic',
        description: 'Professional event photography capturing key moments',
        serviceType: 'media',
        serviceCategory: 'Photography',
        basePrice: '$600',
        priceExclusions: 'Printed photos, elaborate editing'
      },
      {
        title: 'Event Photography - Premium',
        description: 'Comprehensive photography coverage with multiple photographers',
        serviceType: 'media',
        serviceCategory: 'Photography',
        basePrice: '$1200',
        priceExclusions: 'Photo books, same-day delivery'
      },
      {
        title: 'Corporate Headshots',
        description: 'Professional headshots for corporate teams and executives',
        serviceType: 'media',
        serviceCategory: 'Photography',
        basePrice: '$300',
        priceExclusions: 'On-site printing, backdrop changes'
      }
    ],
    'dance_crew': [
      {
        title: 'Dance Performance - 30 Minutes',
        description: 'Energetic 30-minute dance performance by our professional crew',
        serviceType: 'entertainment',
        serviceCategory: 'Dance',
        basePrice: '$800',
        priceExclusions: 'Custom choreography, wardrobe changes'
      },
      {
        title: 'Dance Performance - 1 Hour',
        description: 'Full 1-hour dance performance with multiple routines',
        serviceType: 'entertainment',
        serviceCategory: 'Dance',
        basePrice: '$1500',
        priceExclusions: 'Special effects, additional performers'
      },
      {
        title: 'Dance Workshop',
        description: 'Interactive dance workshop for event attendees',
        serviceType: 'activity',
        serviceCategory: 'Dance',
        basePrice: '$600',
        priceExclusions: 'Materials, extended duration'
      }
    ]
  };
  
  // Create services for each provider
  for (const provider of providerProfiles.rows) {
    // Find the provider's username based on contact_name or other identifiers
    let providerKey = null;
    
    if (provider.contact_name === 'DJ Beats') {
      providerKey = 'dj_beats';
    } else if (provider.contact_name === 'Photography Professional') {
      providerKey = 'photo_pro';
    } else if (provider.contact_name === 'Dance Team Leader') {
      providerKey = 'dance_crew';
    }
    
    if (!providerKey || !servicesByProvider[providerKey]) {
      console.log(`No services defined for provider ${provider.id}. Skipping.`);
      continue;
    }
    
    const services = servicesByProvider[providerKey];
    
    for (const service of services) {
      const newService = await pool.query(`
        INSERT INTO services (
          provider_id, title, description, service_type, service_category,
          base_price, price_exclusions, is_available, created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, TRUE, NOW(), NOW()
        )
        RETURNING id;
      `, [
        provider.id,
        service.title,
        service.description,
        service.serviceType,
        service.serviceCategory,
        service.basePrice,
        service.priceExclusions
      ]);
      
      console.log(`Created service "${service.title}" with id ${newService.rows[0].id} for provider ${provider.id}`);
    }
  }
}

/**
 * Create sample portfolio items for providers
 */
async function createSamplePortfolioItems() {
  // Get provider profile IDs
  const providerProfiles = await pool.query(`
    SELECT id, user_id, contact_name FROM provider_profiles;
  `);
  
  if (providerProfiles.rows.length === 0) {
    console.log('No provider profiles found. Skipping portfolio items creation.');
    return;
  }
  
  // Check if we already have portfolio items
  const existingItems = await pool.query(`
    SELECT COUNT(*) FROM portfolio_items;
  `);
  
  if (parseInt(existingItems.rows[0].count) > 0) {
    console.log(`${existingItems.rows[0].count} portfolio items already exist. Skipping portfolio items creation.`);
    return;
  }
  
  console.log('Creating sample portfolio items...');
  
  const portfolioItemsByProvider = {
    'dj_beats': [
      {
        title: 'Corporate Event DJ Mix',
        description: 'Highlights from a corporate event with 300+ attendees',
        mediaUrl: '/images/portfolio/dj-corporate-event.jpg',
        mediaType: 'image',
        featured: true
      },
      {
        title: 'Wedding Reception Mix',
        description: 'Sample mix from a wedding reception',
        mediaUrl: '/images/portfolio/dj-wedding.jpg',
        mediaType: 'image',
        featured: false
      },
      {
        title: 'Club Performance',
        description: 'Live performance at Club XYZ',
        mediaUrl: '/images/portfolio/dj-club.mp4',
        mediaType: 'video',
        featured: true
      }
    ],
    'photo_pro': [
      {
        title: 'Corporate Event Photography',
        description: 'Photos from a major product launch event',
        mediaUrl: '/images/portfolio/photography-corporate.jpg',
        mediaType: 'image',
        featured: true
      },
      {
        title: 'Gala Dinner Photography',
        description: 'Elegant gala dinner for charity foundation',
        mediaUrl: '/images/portfolio/photography-gala.jpg',
        mediaType: 'image',
        featured: true
      },
      {
        title: 'Team Building Event',
        description: 'Highlights from a corporate team building retreat',
        mediaUrl: '/images/portfolio/photography-team-building.jpg',
        mediaType: 'image',
        featured: false
      },
      {
        title: 'Photography Process',
        description: 'Behind the scenes of our photography process',
        mediaUrl: '/images/portfolio/photography-process.mp4',
        mediaType: 'video',
        featured: false
      }
    ],
    'dance_crew': [
      {
        title: 'Corporate Show Performance',
        description: 'Custom performance for XYZ Corporation',
        mediaUrl: '/images/portfolio/dance-corporate.jpg',
        mediaType: 'image',
        featured: true
      },
      {
        title: 'Festival Performance',
        description: 'Main stage performance at Summer Festival',
        mediaUrl: '/images/portfolio/dance-festival.mp4',
        mediaType: 'video',
        featured: true
      },
      {
        title: 'Product Launch Choreography',
        description: 'Special choreography for a major product launch',
        mediaUrl: '/images/portfolio/dance-product-launch.jpg',
        mediaType: 'image',
        featured: false
      }
    ]
  };
  
  // Create portfolio items for each provider
  for (const provider of providerProfiles.rows) {
    // Find the provider's username based on contact_name or other identifiers
    let providerKey = null;
    
    if (provider.contact_name === 'DJ Beats') {
      providerKey = 'dj_beats';
    } else if (provider.contact_name === 'Photography Professional') {
      providerKey = 'photo_pro';
    } else if (provider.contact_name === 'Dance Team Leader') {
      providerKey = 'dance_crew';
    }
    
    if (!providerKey || !portfolioItemsByProvider[providerKey]) {
      console.log(`No portfolio items defined for provider ${provider.id}. Skipping.`);
      continue;
    }
    
    const portfolioItems = portfolioItemsByProvider[providerKey];
    
    for (let i = 0; i < portfolioItems.length; i++) {
      const item = portfolioItems[i];
      
      const newItem = await pool.query(`
        INSERT INTO portfolio_items (
          provider_id, title, description, media_url, media_type,
          featured, sort_order, created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
        )
        RETURNING id;
      `, [
        provider.id,
        item.title,
        item.description,
        item.mediaUrl,
        item.mediaType,
        item.featured,
        i + 1 // Sort order
      ]);
      
      console.log(`Created portfolio item "${item.title}" with id ${newItem.rows[0].id} for provider ${provider.id}`);
    }
  }
}

/**
 * Main migration function
 */
async function main() {
  try {
    console.log('Starting database migration to normalized schema...');
    
    // Check for missing tables
    const missingTables = await checkRequiredTables();
    
    if (missingTables.length > 0) {
      console.log(`Missing tables: ${missingTables.join(', ')}`);
      
      // Create missing profile tables
      await createProfileTables();
    } else {
      console.log('All required tables already exist.');
    }
    
    // Step 1: Create users and profiles
    await createAdminUserAndProfile();
    await createEmployeeUsersAndProfiles();
    await createCustomerUsersAndProfiles();
    await createProviderUsersAndProfiles();
    
    // Step 2: Create sample content
    await createSampleEvents();
    await createSampleServices();
    await createSamplePortfolioItems();
    
    console.log('Database migration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

main();