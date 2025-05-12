import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  console.log('Connecting to database...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  console.log('Running migrations...');
  
  // Try each migration strategy
  try {
    // First, try running a schema push
    console.log('Creating schema from definitions...');
    
    // Create schema for new tables
    await db.execute(`
      DO $$ 
      BEGIN
        -- Create enums if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
          CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'declined', 'cancelled', 'completed');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_type') THEN
          CREATE TYPE service_type AS ENUM ('entertainment', 'activity', 'media', 'stage', 'host', 'tent', 'food', 'retail', 'utilities', 'digital', 'special_zone');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'portfolio_type') THEN
          CREATE TYPE portfolio_type AS ENUM ('image', 'video', 'link');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
          CREATE TYPE event_type AS ENUM ('business', 'entertainment', 'social', 'cultural', 'educational', 'wellness', 'sports', 'government', 'nonprofit', 'trade', 'hybrid');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_vibe') THEN
          CREATE TYPE event_vibe AS ENUM ('festive', 'family_friendly', 'corporate', 'networking', 'relaxing', 'youthful', 'adventurous', 'cultural', 'artistic', 'elegant', 'kids', 'formal');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'location_type') THEN
          CREATE TYPE location_type AS ENUM ('indoor', 'outdoor', 'hybrid');
        END IF;
        
        -- Create provider_profiles table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_profiles') THEN
          CREATE TABLE provider_profiles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL UNIQUE,
            is_group BOOLEAN DEFAULT FALSE,
            group_name TEXT,
            team_size INTEGER,
            contact_name TEXT,
            contact_phone TEXT,
            current_residence TEXT,
            languages TEXT[],
            view_count INTEGER DEFAULT 0,
            rating REAL,
            review_count INTEGER DEFAULT 0,
            verified BOOLEAN DEFAULT FALSE,
            featured_provider BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        END IF;
        
        -- Create services table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
          CREATE TABLE services (
            id SERIAL PRIMARY KEY,
            provider_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            service_type service_type NOT NULL,
            service_category TEXT NOT NULL,
            base_price NUMERIC(10, 2),
            price_exclusions TEXT,
            is_available BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        END IF;
        
        -- Create availability table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'availability') THEN
          CREATE TABLE availability (
            id SERIAL PRIMARY KEY,
            provider_id INTEGER NOT NULL,
            date DATE NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            is_blocked BOOLEAN DEFAULT FALSE,
            note TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          );
        END IF;
        
        -- Create portfolio_items table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portfolio_items') THEN
          CREATE TABLE portfolio_items (
            id SERIAL PRIMARY KEY,
            provider_id INTEGER NOT NULL,
            service_id INTEGER,
            type portfolio_type NOT NULL,
            title TEXT,
            description TEXT,
            url TEXT NOT NULL,
            is_approved BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW()
          );
        END IF;
        
        -- Create bookings table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
          CREATE TABLE bookings (
            id SERIAL PRIMARY KEY,
            event_id INTEGER NOT NULL,
            service_id INTEGER NOT NULL,
            provider_id INTEGER NOT NULL,
            customer_id INTEGER NOT NULL,
            status booking_status DEFAULT 'pending',
            request_date TIMESTAMP DEFAULT NOW(),
            start_time TEXT,
            end_time TEXT,
            agree_price NUMERIC(10, 2),
            platform_fee NUMERIC(10, 2),
            special_instructions TEXT,
            contract_path TEXT,
            cancel_reason TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        END IF;
        
        -- Create reviews table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
          CREATE TABLE reviews (
            id SERIAL PRIMARY KEY,
            booking_id INTEGER NOT NULL,
            provider_id INTEGER NOT NULL,
            customer_id INTEGER NOT NULL,
            rating INTEGER NOT NULL,
            comment TEXT,
            provider_response TEXT,
            is_visible BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        END IF;
        
        -- Create messages table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
          CREATE TABLE messages (
            id SERIAL PRIMARY KEY,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            booking_id INTEGER,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            read_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
          );
        END IF;
        
        -- Create payments table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
          CREATE TABLE payments (
            id SERIAL PRIMARY KEY,
            booking_id INTEGER NOT NULL,
            customer_id INTEGER NOT NULL,
            provider_id INTEGER NOT NULL,
            amount NUMERIC(10, 2) NOT NULL,
            platform_fee NUMERIC(10, 2),
            payment_method TEXT,
            transaction_id TEXT,
            status TEXT NOT NULL,
            payment_date TIMESTAMP,
            invoice_path TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          );
        END IF;
        
        -- Create notifications table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
          CREATE TABLE notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            redirect_url TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          );
        END IF;
        
        -- Create settings table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings') THEN
          CREATE TABLE settings (
            id SERIAL PRIMARY KEY,
            setting_key TEXT NOT NULL UNIQUE,
            setting_value TEXT,
            data_type TEXT NOT NULL,
            description TEXT,
            updated_by INTEGER,
            updated_at TIMESTAMP DEFAULT NOW()
          );
        END IF;
        
        -- Update users table schema if it needs additional columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
          ALTER TABLE users ADD COLUMN phone TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'country') THEN
          ALTER TABLE users ADD COLUMN country TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'city') THEN
          ALTER TABLE users ADD COLUMN city TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'nationality') THEN
          ALTER TABLE users ADD COLUMN nationality TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
          ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login') THEN
          ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
          ALTER TABLE users ADD COLUMN avatar_url TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_organization') THEN
          ALTER TABLE users ADD COLUMN is_organization BOOLEAN DEFAULT FALSE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_name') THEN
          ALTER TABLE users ADD COLUMN organization_name TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bio') THEN
          ALTER TABLE users ADD COLUMN bio TEXT;
        END IF;
        
        -- Update events table schema if it needs additional columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'start_time') THEN
          ALTER TABLE events ADD COLUMN start_time TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'end_time') THEN
          ALTER TABLE events ADD COLUMN end_time TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'location') THEN
          ALTER TABLE events ADD COLUMN location TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'location_type') THEN
          ALTER TABLE events ADD COLUMN location_type location_type;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'event_type') THEN
          ALTER TABLE events ADD COLUMN event_type event_type;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'vibe') THEN
          ALTER TABLE events ADD COLUMN vibe event_vibe;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'audience_size') THEN
          ALTER TABLE events ADD COLUMN audience_size INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'budget') THEN
          ALTER TABLE events ADD COLUMN budget NUMERIC(10, 2);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'updated_at') THEN
          ALTER TABLE events ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        END IF;
        
        -- Modify value column to numeric if it's integer
        IF EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'events' AND column_name = 'value' 
          AND data_type = 'integer'
        ) THEN
          ALTER TABLE events 
          ALTER COLUMN value TYPE NUMERIC(10, 2) USING value::numeric;
        END IF;
      END $$;
    `);
    
    console.log('Schema migration completed successfully');
  } catch (err) {
    console.error('Error during migration:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});