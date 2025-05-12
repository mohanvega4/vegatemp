// Import the pg module
import pg from 'pg';
const { Pool } = pg;

// Create a PostgreSQL pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Get user ID by username
async function getUserIdByUsername(username) {
  try {
    const result = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      throw new Error(`User ${username} not found`);
    }
    
    return result.rows[0].id;
  } catch (error) {
    console.error(`Error fetching user ID for ${username}:`, error);
    throw error;
  }
}

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

// Create services for talent
async function createServicesForTalent() {
  console.log('Creating talent services...');
  
  for (const [username, services] of Object.entries(talentServices)) {
    try {
      const userId = await getUserIdByUsername(username);
      
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
    } catch (error) {
      console.error(`Error creating services for ${username}:`, error);
    }
  }
}

// Add portfolio items
async function addPortfolioItems() {
  console.log('Creating talent portfolios...');
  
  for (const [username, portfolio] of Object.entries(portfolioData)) {
    try {
      const userId = await getUserIdByUsername(username);
      
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
    } catch (error) {
      console.error(`Error creating portfolio for ${username}:`, error);
    }
  }
}

// Add reviews
async function addReviews() {
  console.log('Creating reviews...');
  
  for (const [username, reviews] of Object.entries(reviewsData)) {
    try {
      const talentId = await getUserIdByUsername(username);
      const customerIds = await pool.query('SELECT id FROM users WHERE role = $1', ['customer']);
      
      for (const review of reviews) {
        // Randomly assign a customer from our list
        const randomIndex = Math.floor(Math.random() * customerIds.rows.length);
        const randomCustomerId = customerIds.rows[randomIndex].id;
        
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
    } catch (error) {
      console.error(`Error creating reviews for ${username}:`, error);
    }
  }
}

// Main function
async function main() {
  try {
    console.log('Starting talent services and profiles seed script...');
    
    // Create services
    await createServicesForTalent();
    
    // Add portfolio items
    await addPortfolioItems();
    
    // Add reviews
    await addReviews();
    
    console.log('Talent services and profiles seeding completed successfully!');
  } catch (error) {
    console.error('Error in seed script:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the main function
main();