import { pool } from '../server/db.js';
// If the above import fails, try this:
// import pg from 'pg';
// const { Pool } = pg;
// const pool = new Pool({ connectionString: process.env.DATABASE_URL });
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

// Dummy data configuration
const commonPassword = 'password123';

const customerUsers = [
  {
    username: 'customer1',
    email: 'customer1@example.com',
    name: 'Sarah Johnson',
    role: 'customer'
  },
  {
    username: 'customer2',
    email: 'customer2@example.com',
    name: 'Michael Chen',
    role: 'customer'
  },
  {
    username: 'customer3',
    email: 'customer3@example.com',
    name: 'Emily Rodriguez',
    role: 'customer'
  }
];

const talentUsers = [
  {
    username: 'dj_beats',
    email: 'dj@example.com',
    name: 'DJ Maestro',
    role: 'provider'
  },
  {
    username: 'photo_pro',
    email: 'photographer@example.com',
    name: 'Lens Master',
    role: 'provider'
  },
  {
    username: 'dance_crew',
    email: 'dancers@example.com',
    name: 'Rhythm Squad',
    role: 'provider'
  },
  {
    username: 'magic_show',
    email: 'magician@example.com',
    name: 'Mystic Wonder',
    role: 'provider'
  }
];

// Sample events for customers
const events = [
  {
    title: 'Summer Music Festival',
    description: 'A 3-day outdoor music festival featuring top artists and bands.',
    location: 'Central Park',
    startDate: '2025-07-15T10:00:00.000Z',
    endDate: '2025-07-17T22:00:00.000Z',
    status: 'confirmed',
    budget: 25000
  },
  {
    title: 'Corporate Annual Meeting',
    description: 'Annual stakeholder meeting with presentations and networking.',
    location: 'Grand Hotel Conference Center',
    startDate: '2025-05-20T09:00:00.000Z',
    endDate: '2025-05-20T17:00:00.000Z',
    status: 'confirmed',
    budget: 15000
  },
  {
    title: 'Wedding Celebration',
    description: 'Elegant evening wedding ceremony and reception.',
    location: 'Lakeside Gardens',
    startDate: '2025-06-12T16:00:00.000Z',
    endDate: '2025-06-12T23:00:00.000Z',
    status: 'pending',
    budget: 18000
  },
  {
    title: 'Tech Conference',
    description: 'Annual gathering of technology professionals with workshops and keynotes.',
    location: 'Tech Convention Center',
    startDate: '2025-09-05T08:00:00.000Z',
    endDate: '2025-09-07T18:00:00.000Z',
    status: 'confirmed',
    budget: 35000
  },
  {
    title: 'Product Launch Party',
    description: 'Exclusive event to showcase our new product line.',
    location: 'Modern Art Gallery',
    startDate: '2025-05-30T19:00:00.000Z',
    endDate: '2025-05-30T23:00:00.000Z',
    status: 'pending',
    budget: 12000
  }
];

// Sample talent services
const talentServices = {
  'dj_beats': [
    {
      category: 'DJs',
      subcategory: 'Party',
      title: 'Party DJ Service',
      description: 'High-energy DJ service for parties and nightclubs with state-of-the-art equipment and lighting.',
      basePrice: 500,
      isAvailable: true
    },
    {
      category: 'DJs',
      subcategory: 'Wedding',
      title: 'Wedding DJ & MC Package',
      description: 'Full-service DJ and MC for wedding receptions, including ceremony music, dinner ambiance, and dance sets.',
      basePrice: 800,
      isAvailable: true
    }
  ],
  'photo_pro': [
    {
      category: 'Photography',
      subcategory: 'Event',
      title: 'Event Photography',
      description: 'Professional event photography with quick turnaround and online gallery delivery.',
      basePrice: 650,
      isAvailable: true
    },
    {
      category: 'Photography',
      subcategory: 'Portrait',
      title: 'Professional Portraits',
      description: 'Studio-quality portraits for individuals or groups with professional editing and retouching.',
      basePrice: 300,
      isAvailable: true
    }
  ],
  'dance_crew': [
    {
      category: 'Dancers',
      subcategory: 'Modern',
      title: 'Contemporary Dance Performance',
      description: 'A team of 6 professional dancers performing contemporary choreography for special events.',
      basePrice: 1200,
      isAvailable: true
    },
    {
      category: 'Dancers',
      subcategory: 'Break',
      title: 'Breakdance Show',
      description: 'High-energy breakdance performance with interactive audience elements.',
      basePrice: 800,
      isAvailable: true
    }
  ],
  'magic_show': [
    {
      category: 'Magicians',
      subcategory: 'Stage',
      title: 'Stage Illusion Show',
      description: 'Full stage magic show with grand illusions and audience participation.',
      basePrice: 1500,
      isAvailable: true
    },
    {
      category: 'Magicians',
      subcategory: 'Close-up',
      title: 'Close-up Magic',
      description: 'Intimate close-up magic perfect for cocktail hours and small gatherings.',
      basePrice: 400,
      isAvailable: true
    }
  ]
};

// Portfolio data for talent
const portfolioData = {
  'dj_beats': {
    bio: 'Professional DJ with over 10 years of experience in clubs, weddings, and corporate events. Known for reading the crowd and creating the perfect atmosphere.',
    images: [
      'https://images.unsplash.com/photo-1605723517503-3cadb5818a0c',
      'https://images.unsplash.com/photo-1571266028027-31b042d898f4'
    ],
    videos: [
      'https://www.youtube.com/watch?v=example1',
      'https://vimeo.com/example1'
    ],
    languages: ['English', 'Spanish']
  },
  'photo_pro': {
    bio: 'Award-winning photographer specializing in event, portrait, and commercial photography. Each image tells a unique story with attention to detail and creative composition.',
    images: [
      'https://images.unsplash.com/photo-1542038784456-1ea8e935640e',
      'https://images.unsplash.com/photo-1551737823-bfbab5b92265'
    ],
    videos: [
      'https://www.youtube.com/watch?v=example2',
      'https://vimeo.com/example2'
    ],
    languages: ['English', 'French']
  },
  'dance_crew': {
    bio: 'Dynamic dance crew performing various styles including contemporary, hip-hop, and breakdance. Available for events, music videos, and live performances.',
    images: [
      'https://images.unsplash.com/photo-1535525153412-5a42439a210d',
      'https://images.unsplash.com/photo-1544442069-bdea78aa887d'
    ],
    videos: [
      'https://www.youtube.com/watch?v=example3',
      'https://vimeo.com/example3'
    ],
    languages: ['English', 'Arabic']
  },
  'magic_show': {
    bio: 'Captivating magician performing mind-boggling illusions and sleight of hand magic. Perfect for corporate events, private parties, and stage shows.',
    images: [
      'https://images.unsplash.com/photo-1572385856637-aac1da39126a',
      'https://images.unsplash.com/photo-1542723300-4c7c3fcd0305'
    ],
    videos: [
      'https://www.youtube.com/watch?v=example4',
      'https://vimeo.com/example4'
    ],
    languages: ['English', 'Hindi']
  }
};

// Reviews for talent
const reviewsData = {
  'dj_beats': [
    {
      customerName: 'Sarah Johnson',
      rating: 5,
      comment: 'DJ Maestro was incredible! He kept the dance floor packed all night at our wedding reception.',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) // 30 days ago
    },
    {
      customerName: 'Michael Chen',
      rating: 4,
      comment: 'Great music selection and professional setup. Would recommend for any corporate event.',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15) // 15 days ago
    }
  ],
  'photo_pro': [
    {
      customerName: 'Emily Rodriguez',
      rating: 5,
      comment: 'Lens Master captured our event beautifully. The attention to detail was exceptional.',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20) // 20 days ago
    }
  ],
  'dance_crew': [
    {
      customerName: 'Sarah Johnson',
      rating: 5,
      comment: 'Rhythm Squad brought incredible energy to our product launch. Everyone was amazed!',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10) // 10 days ago
    }
  ],
  'magic_show': [
    {
      customerName: 'Michael Chen',
      rating: 5,
      comment: 'Mystic Wonder had our guests completely mesmerized. A perfect addition to our corporate gala.',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) // 5 days ago
    }
  ]
};

// Clean the database first to avoid duplicate entries
async function cleanDatabase() {
  console.log('Cleaning database...');
  
  // Drop existing data but keep the structure
  await pool.query('TRUNCATE activities CASCADE');
  await pool.query('TRUNCATE events CASCADE');
  await pool.query('TRUNCATE users CASCADE RESTART IDENTITY');
  
  console.log('Database cleaned');
}

// Create users
async function createUsers() {
  const hashedPassword = await hashPassword(commonPassword);
  
  console.log('Creating customer users...');
  const customerIds = [];
  for (const user of customerUsers) {
    const result = await pool.query(
      'INSERT INTO users (username, password, email, name, role, status, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [user.username, hashedPassword, user.email, user.name, user.role, 'active', new Date()]
    );
    const userId = result.rows[0].id;
    customerIds.push(userId);
    console.log(`Created ${user.role}: ${user.name} (${user.username}) - ID: ${userId}`);
  }
  
  console.log('Creating talent users...');
  const talentMap = {}; // To store username -> id mapping
  for (const user of talentUsers) {
    const result = await pool.query(
      'INSERT INTO users (username, password, email, name, role, status, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [user.username, hashedPassword, user.email, user.name, user.role, 'active', new Date()]
    );
    const userId = result.rows[0].id;
    talentMap[user.username] = userId;
    console.log(`Created ${user.role}: ${user.name} (${user.username}) - ID: ${userId}`);
  }
  
  console.log('All users created successfully!');
  console.log('Password for all users:', commonPassword);
  
  return { customerIds, talentMap };
}

// Create events
async function createEvents(customerIds) {
  console.log('Creating events...');
  const eventIds = [];
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const customerId = customerIds[i % customerIds.length];
    
    const result = await pool.query(
      `INSERT INTO events (
        name, description, customer_id, event_date, end_date, status, value, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        event.title,
        event.description,
        customerId,
        new Date(event.startDate),
        new Date(event.endDate),
        event.status,
        event.budget,
        new Date()
      ]
    );
    
    const eventId = result.rows[0].id;
    eventIds.push(eventId);
    console.log(`Created event: ${event.title} - ID: ${eventId}`);
  }
  
  return eventIds;
}

// Create activities
async function createActivities(customerIds, talentIds, eventIds) {
  console.log('Creating activities...');
  
  const activityTypes = [
    'user_registration',
    'event_created', 
    'booking_confirmed',
    'payment_completed',
    'review_submitted',
    'message_sent'
  ];
  
  for (let i = 0; i < 20; i++) {
    const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const randomUser = Math.random() > 0.5 
      ? customerIds[Math.floor(Math.random() * customerIds.length)]
      : talentIds[Math.floor(Math.random() * talentIds.length)];
    
    const daysAgo = Math.floor(Math.random() * 30); // Random day in the last month
    const timestamp = new Date(Date.now() - 1000 * 60 * 60 * 24 * daysAgo);
    
    await pool.query(
      'INSERT INTO activities (activity_type, description, user_id, created_at) VALUES ($1, $2, $3, $4)',
      [
        randomType,
        `Activity of type ${randomType} performed by user ${randomUser}`,
        randomUser,
        timestamp
      ]
    );
  }
  
  console.log('Created 20 random activities');
}

// Create services for talent
async function createTalentServices(talentMap) {
  console.log('Creating talent services...');
  
  for (const [username, services] of Object.entries(talentServices)) {
    const userId = talentMap[username];
    
    if (!userId) {
      console.log(`User ${username} not found, skipping services creation`);
      continue;
    }
    
    for (const service of services) {
      await pool.query(
        'INSERT INTO activities (activity_type, description, user_id, created_at, data) VALUES ($1, $2, $3, $4, $5)',
        [
          'service',
          `${service.title}: ${service.description}`,
          userId,
          new Date(),
          JSON.stringify(service)
        ]
      );
      
      console.log(`Created service: ${service.title} for ${username}`);
    }
  }
}

// Create portfolio entries
async function createPortfolios(talentMap) {
  console.log('Creating talent portfolios...');
  
  for (const [username, portfolio] of Object.entries(portfolioData)) {
    const userId = talentMap[username];
    
    if (!userId) {
      console.log(`User ${username} not found, skipping portfolio creation`);
      continue;
    }
    
    await pool.query(
      'INSERT INTO activities (activity_type, description, user_id, created_at, data) VALUES ($1, $2, $3, $4, $5)',
      [
        'portfolio',
        `Portfolio for ${username}`,
        userId,
        new Date(),
        JSON.stringify(portfolio)
      ]
    );
    
    console.log(`Created portfolio for ${username}`);
  }
}

// Create reviews
async function createReviews(talentMap, customerIds) {
  console.log('Creating reviews...');
  
  for (const [username, reviews] of Object.entries(reviewsData)) {
    const talentId = talentMap[username];
    
    if (!talentId) {
      console.log(`User ${username} not found, skipping reviews creation`);
      continue;
    }
    
    for (const review of reviews) {
      // Randomly assign a customer from our list
      const randomCustomerId = customerIds[Math.floor(Math.random() * customerIds.length)];
      
      await pool.query(
        'INSERT INTO activities (activity_type, description, user_id, created_at, data) VALUES ($1, $2, $3, $4, $5)',
        [
          'review',
          `Review for ${username}: ${review.rating}/5 stars`,
          talentId, // The review is stored on the talent's profile
          review.date,
          JSON.stringify({
            ...review,
            customerId: randomCustomerId
          })
        ]
      );
      
      console.log(`Created review for ${username}: ${review.rating}/5 stars`);
    }
  }
}

// Create bookings between customers and talent
async function createBookings(customerIds, talentMap, eventIds) {
  console.log('Creating bookings...');
  
  // Create a few sample bookings
  const bookings = [
    {
      status: 'confirmed',
      fee: 2500,
      notes: 'Please arrive 1 hour before the event for setup',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10) // 10 days ago
    },
    {
      status: 'pending',
      fee: 1800,
      notes: 'Need to discuss equipment requirements',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) // 5 days ago
    },
    {
      status: 'confirmed',
      fee: 3200,
      notes: 'Full day coverage with edited photos within 2 weeks',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) // 3 days ago
    }
  ];
  
  const talentUsernames = Object.keys(talentMap);
  
  for (let i = 0; i < bookings.length; i++) {
    const booking = bookings[i];
    const customerId = customerIds[i % customerIds.length];
    const talentUsername = talentUsernames[i % talentUsernames.length];
    const talentId = talentMap[talentUsername];
    const eventId = eventIds[i % eventIds.length];
    
    await pool.query(
      'INSERT INTO activities (activity_type, description, user_id, created_at, data) VALUES ($1, $2, $3, $4, $5)',
      [
        'booking',
        `Booking between customer ${customerId} and talent ${talentId} for event ${eventId}`,
        customerId, // Store booking on customer's activity feed
        booking.date,
        JSON.stringify({
          ...booking,
          customerId,
          talentId,
          eventId
        })
      ]
    );
    
    console.log(`Created booking between customer ${customerId} and talent ${talentId}`);
  }
}

async function main() {
  try {
    // Clean database first
    await cleanDatabase();
    
    // Create users
    const { customerIds, talentMap } = await createUsers();
    
    // Create an admin user if one doesn't exist
    const adminResult = await pool.query('SELECT * FROM users WHERE role = $1', ['admin']);
    if (adminResult.rows.length === 0) {
      const hashedPassword = await hashPassword('adminpassword');
      await pool.query(
        'INSERT INTO users (username, password, email, name, role, status, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
        ['admin', hashedPassword, 'admin@example.com', 'System Admin', 'admin', 'active', new Date()]
      );
      console.log('Created admin user: admin / adminpassword');
    }
    
    // Get talent IDs from the map
    const talentIds = Object.values(talentMap);
    
    // Create events
    const eventIds = await createEvents(customerIds);
    
    // Create activities
    await createActivities(customerIds, talentIds, eventIds);
    
    // Create talent services
    await createTalentServices(talentMap);
    
    // Create portfolios
    await createPortfolios(talentMap);
    
    // Create reviews
    await createReviews(talentMap, customerIds);
    
    // Create bookings
    await createBookings(customerIds, talentMap, eventIds);
    
    console.log('===================================');
    console.log('All dummy data created successfully!');
    console.log('Admin account:     admin / adminpassword');
    console.log('Customer accounts:', customerUsers.map(u => u.username).join(', '), '/', commonPassword);
    console.log('Talent accounts:  ', talentUsers.map(u => u.username).join(', '), '/', commonPassword);
    console.log('===================================');
  } catch (error) {
    console.error('Error creating dummy data:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

main();