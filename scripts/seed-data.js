// Import the pg module
import pg from 'pg';
const { Pool } = pg;

// Create a PostgreSQL pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Get user IDs by role
async function getUserIdsByRole(role) {
  try {
    const result = await pool.query(
      'SELECT id FROM users WHERE role = $1',
      [role]
    );
    return result.rows.map(row => row.id);
  } catch (error) {
    console.error(`Error fetching ${role} IDs:`, error);
    throw error;
  }
}

// Sample events for customers
const events = [
  {
    name: 'Summer Music Festival',
    description: 'A 3-day outdoor music festival featuring top artists and bands.',
    eventDate: '2025-07-15T10:00:00.000Z',
    endDate: '2025-07-17T22:00:00.000Z',
    status: 'confirmed',
    value: 25000
  },
  {
    name: 'Corporate Annual Meeting',
    description: 'Annual stakeholder meeting with presentations and networking.',
    eventDate: '2025-05-20T09:00:00.000Z',
    endDate: '2025-05-20T17:00:00.000Z',
    status: 'confirmed',
    value: 15000
  },
  {
    name: 'Wedding Celebration',
    description: 'Elegant evening wedding ceremony and reception.',
    eventDate: '2025-06-12T16:00:00.000Z',
    endDate: '2025-06-12T23:00:00.000Z',
    status: 'pending',
    value: 18000
  },
  {
    name: 'Tech Conference',
    description: 'Annual gathering of technology professionals with workshops and keynotes.',
    eventDate: '2025-09-05T08:00:00.000Z',
    endDate: '2025-09-07T18:00:00.000Z',
    status: 'confirmed',
    value: 35000
  },
  {
    name: 'Product Launch Party',
    description: 'Exclusive event to showcase our new product line.',
    eventDate: '2025-05-30T19:00:00.000Z',
    endDate: '2025-05-30T23:00:00.000Z',
    status: 'pending',
    value: 12000
  }
];

// Create events
async function createEvents(customerIds) {
  console.log('Creating events...');
  const eventIds = [];
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const customerId = customerIds[i % customerIds.length];
    
    try {
      const result = await pool.query(
        `INSERT INTO events (
          name, description, customer_id, event_date, end_date, status, value, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          event.name,
          event.description,
          customerId,
          new Date(event.eventDate),
          new Date(event.endDate),
          event.status,
          event.value,
          new Date()
        ]
      );
      
      const eventId = result.rows[0].id;
      eventIds.push(eventId);
      console.log(`Created event: ${event.name} - ID: ${eventId}`);
    } catch (error) {
      console.error(`Error creating event ${event.name}:`, error);
    }
  }
  
  return eventIds;
}

// Create activities
async function createActivities(customerIds, talentIds) {
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
    
    try {
      await pool.query(
        'INSERT INTO activities (activity_type, description, user_id, created_at) VALUES ($1, $2, $3, $4)',
        [
          randomType,
          `Activity of type ${randomType} performed by user ${randomUser}`,
          randomUser,
          timestamp
        ]
      );
    } catch (error) {
      console.error(`Error creating activity:`, error);
    }
  }
  
  console.log('Created 20 random activities');
}

// Create bookings between customers and talent
async function createBookings(customerIds, talentIds, eventIds) {
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
  
  for (let i = 0; i < bookings.length; i++) {
    const booking = bookings[i];
    const customerId = customerIds[i % customerIds.length];
    const talentId = talentIds[i % talentIds.length];
    const eventId = eventIds[i % eventIds.length];
    
    try {
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
    } catch (error) {
      console.error(`Error creating booking:`, error);
    }
  }
}

// Main function
async function main() {
  try {
    console.log('Starting data seed script...');
    
    // Get customer IDs
    const customerIds = await getUserIdsByRole('customer');
    console.log(`Found ${customerIds.length} customers`);
    
    // Get talent IDs
    const talentIds = await getUserIdsByRole('provider');
    console.log(`Found ${talentIds.length} talent providers`);
    
    if (customerIds.length === 0) {
      throw new Error('No customers found. Run seed-users.js first.');
    }
    
    if (talentIds.length === 0) {
      throw new Error('No talent providers found. Run seed-users.js first.');
    }
    
    // Create events
    const eventIds = await createEvents(customerIds);
    
    // Create activities
    await createActivities(customerIds, talentIds);
    
    // Create bookings
    await createBookings(customerIds, talentIds, eventIds);
    
    console.log('Data seeding completed successfully!');
  } catch (error) {
    console.error('Error in seed script:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the main function
main();