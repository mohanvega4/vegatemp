import { users, type User, type InsertUser, events, type Event, type InsertEvent, activities, type Activity, type InsertActivity, proposals, type Proposal, type InsertProposal } from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, desc, and, SQL, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

// Define the storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getUsers(filters?: Partial<User>): Promise<User[]>;
  
  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  getEvents(filters?: Partial<Event>): Promise<Event[]>;
  
  // Activity operations
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivities(limit?: number): Promise<Activity[]>;
  
  // Proposal operations
  getProposal(id: number): Promise<Proposal | undefined>;
  getEventProposals(eventId: number): Promise<Proposal[]>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposal(id: number, proposal: Partial<InsertProposal>): Promise<Proposal | undefined>;
  
  // Notification operations
  createNotification(notification: { 
    userId: number; 
    type: string; 
    title: string; 
    message: string; 
    redirectUrl?: string; 
  }): Promise<any>;
  
  // Session store
  sessionStore: session.Store;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Initialize PostgreSQL session store
    try {
      this.sessionStore = new PostgresSessionStore({
        pool: pool,
        createTableIfMissing: true
      });
      
      console.log('Initialized PostgreSQL session store');
    } catch (error) {
      console.error('Failed to initialize PostgreSQL session store:', error);
      throw new Error('Database connection is required for session management');
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      // Try with Drizzle ORM
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error retrieving user by ID with Drizzle:', error instanceof Error ? error.message : 'Unknown error');
      
      // If Drizzle fails, try with direct SQL query as fallback
      try {
        const client = await pool.connect();
        try {
          const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
          if (result.rows.length === 0) {
            return undefined;
          }
          
          // Convert snake_case column names to camelCase
          const userRecord = result.rows[0];
          return {
            id: userRecord.id,
            username: userRecord.username,
            email: userRecord.email,
            password: userRecord.password,
            name: userRecord.name,
            role: userRecord.role,
            status: userRecord.status,
            bio: userRecord.bio,
            phone: userRecord.phone,
            avatar: userRecord.avatar,
            cover: userRecord.cover,
            website: userRecord.website,
            isVerified: userRecord.is_verified,
            location: userRecord.location,
            createdAt: userRecord.created_at ? new Date(userRecord.created_at) : null,
            updatedAt: userRecord.updated_at ? new Date(userRecord.updated_at) : null,
            city: userRecord.city,
            country: userRecord.country,
            nationality: userRecord.nationality,
            lastLogin: userRecord.last_login ? new Date(userRecord.last_login) : null,
            socialLinks: userRecord.social_links,
            preferences: userRecord.preferences,
            timezone: userRecord.timezone
          } as unknown as User;
        } finally {
          client.release();
        }
      } catch (sqlError) {
        console.error('Error retrieving user by ID with direct SQL:', 
          sqlError instanceof Error ? sqlError.message : 'Unknown error');
        
        // If both methods fail, return undefined
        return undefined;
      }
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // Try with Drizzle ORM
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error('Error retrieving user by username with Drizzle:', 
        error instanceof Error ? error.message : 'Unknown error');
      
      // If Drizzle fails, try with direct SQL query as fallback
      try {
        const client = await pool.connect();
        try {
          const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
          if (result.rows.length === 0) {
            return undefined;
          }
          
          // Convert snake_case column names to camelCase
          const userRecord = result.rows[0];
          return {
            id: userRecord.id,
            username: userRecord.username,
            email: userRecord.email,
            password: userRecord.password,
            name: userRecord.name,
            role: userRecord.role,
            status: userRecord.status,
            bio: userRecord.bio,
            phone: userRecord.phone,
            avatar: userRecord.avatar,
            cover: userRecord.cover,
            website: userRecord.website,
            isVerified: userRecord.is_verified,
            location: userRecord.location,
            createdAt: userRecord.created_at ? new Date(userRecord.created_at) : null,
            updatedAt: userRecord.updated_at ? new Date(userRecord.updated_at) : null,
            city: userRecord.city,
            country: userRecord.country,
            nationality: userRecord.nationality,
            lastLogin: userRecord.last_login ? new Date(userRecord.last_login) : null,
            socialLinks: userRecord.social_links,
            preferences: userRecord.preferences,
            timezone: userRecord.timezone
          } as unknown as User;
        } finally {
          client.release();
        }
      } catch (sqlError) {
        console.error('Error retrieving user by username with direct SQL:', 
          sqlError instanceof Error ? sqlError.message : 'Unknown error');
        
        // If both methods fail, return undefined
        return undefined;
      }
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Always provide required fields with their default values
      const userData = {
        ...insertUser,
        role: insertUser.role ?? 'customer',
        status: insertUser.status ?? 'pending'
      };
      
      const [user] = await db.insert(users).values(userData).returning();
      return user;
    } catch (error) {
      console.error('Error creating user:', error instanceof Error ? error.message : 'Unknown error');
      throw new Error('Failed to create user. Database connection error.');
    }
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error instanceof Error ? error.message : 'Unknown error');
      return undefined;
    }
  }

  async getUsers(filters?: Partial<User>): Promise<User[]> {
    try {
      if (!filters || Object.keys(filters).length === 0) {
        return await db.select().from(users);
      }
      
      // Build conditions based on filters
      const conditions: SQL[] = [];
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          const column = users[key as keyof typeof users];
          if (column) {
            conditions.push(eq(column as any, value));
          }
        }
      });
      
      if (conditions.length === 0) {
        return await db.select().from(users);
      }
      
      return await db.select().from(users).where(and(...conditions));
    } catch (error) {
      console.error('Error getting users:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    try {
      // Using direct SQL query for consistent handling
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM events WHERE id = $1', [id]);
        if (result.rows.length === 0) {
          return undefined;
        }
        
        // Print raw event data for debugging
        console.log('Raw event data:', result.rows[0]);
        
        // Process date fields properly
        const event = result.rows[0];
        
        // Convert snake_case to camelCase for frontend consumption
        const camelCaseEvent = Object.entries(event).reduce((acc, [key, value]) => {
          // Convert snake_case to camelCase
          const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          acc[camelKey] = value;
          return acc;
        }, {} as Record<string, any>);
        
        // Explicitly ensure customerId exists (mapped from customer_id)
        if (event.customer_id) {
          camelCaseEvent.customerId = event.customer_id;
        }
        
        // Explicitly handle date fields
        if (event.event_date) {
          camelCaseEvent.eventDate = new Date(event.event_date);
        }
        
        if (event.end_date) {
          camelCaseEvent.endDate = new Date(event.end_date);
        }
        
        if (event.created_at) {
          camelCaseEvent.createdAt = new Date(event.created_at);
        }
        
        if (event.updated_at) {
          camelCaseEvent.updatedAt = new Date(event.updated_at);
        }
        
        return camelCaseEvent as unknown as Event;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error retrieving event:', error instanceof Error ? error.message : 'Unknown error');
      return undefined;
    }
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    try {
      // Execute direct SQL insert to avoid type conversion issues
      const client = await pool.connect();
      try {
        // Get the max ID to ensure we create a unique ID
        const maxIdResult = await client.query('SELECT MAX(id) FROM events');
        const maxId = maxIdResult.rows[0].max || 0;
        const newId = maxId + 1;
        console.log(`Auto-generating new event ID: ${newId} (max ID was ${maxId})`);
        
        // Process the insert data
        const processedData = {
          ...insertEvent,
          id: newId, // Set the new ID
          status: insertEvent.status ?? 'pending'
        };
        
        // Prepare column names and values for the SQL statement
        const columns: string[] = [];
        const placeholders: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        
        // Create INSERT clause for the SQL statement
        for (const [key, value] of Object.entries(processedData)) {
          if (value !== undefined) {
            // Convert camelCase to snake_case for SQL
            const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            
            // Special handling for customerId to ensure it's stored as customer_id
            const columnName = key === 'customerId' ? 'customer_id' : snakeKey;
            columns.push(columnName);
            placeholders.push(`$${paramIndex}`);
            
            // Handle date fields for correct timestamp conversion
            if (key === 'eventDate' || key === 'endDate') {
              if (value instanceof Date) {
                values.push(value);
              } else if (typeof value === 'string') {
                values.push(new Date(value));
              } else {
                values.push(null);
              }
            } else {
              values.push(value);
            }
            
            paramIndex++;
          }
        }
        
        // Add created_at and updated_at timestamps
        const now = new Date();
        columns.push('created_at');
        placeholders.push(`$${paramIndex++}`);
        values.push(now);
        
        columns.push('updated_at');
        placeholders.push(`$${paramIndex++}`);
        values.push(now);
        
        // Construct SQL query
        const sql = `
          INSERT INTO events (${columns.join(', ')}) 
          VALUES (${placeholders.join(', ')})
          RETURNING *
        `;
        
        console.log('Executing insert SQL:', sql);
        console.log('With parameters:', values);
        
        // Execute the insert query
        const result = await client.query(sql, values);
        
        if (result.rows.length === 0) {
          throw new Error('Failed to create event');
        }
        
        // Convert snake_case to camelCase for frontend consumption
        const eventRecord = result.rows[0];
        const camelCaseEvent = Object.entries(eventRecord).reduce((acc, [key, value]) => {
          // Convert snake_case to camelCase
          const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          acc[camelKey] = value;
          return acc;
        }, {} as Record<string, any>);
        
        // Handle date fields
        if (eventRecord.event_date) {
          camelCaseEvent.eventDate = new Date(eventRecord.event_date);
        }
        
        if (eventRecord.end_date) {
          camelCaseEvent.endDate = new Date(eventRecord.end_date);
        }
        
        if (eventRecord.created_at) {
          camelCaseEvent.createdAt = new Date(eventRecord.created_at);
        }
        
        if (eventRecord.updated_at) {
          camelCaseEvent.updatedAt = new Date(eventRecord.updated_at);
        }
        
        console.log('Created event:', camelCaseEvent);
        return camelCaseEvent as unknown as Event;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating event:', error instanceof Error ? error.message : 'Unknown error');
      // Fail hard with an error
      throw new Error('Failed to create event. Database connection error.');
    }
  }

  async updateEvent(id: number, eventData: Partial<InsertEvent>): Promise<Event | undefined> {
    // Execute direct SQL update to avoid type conversion issues
    const client = await pool.connect();
    try {
      // Process date fields before updating
      const processedData = { ...eventData };
      
      // Prepare column updates
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      // Create SET clause for SQL statement
      for (const [key, value] of Object.entries(processedData)) {
        if (value !== undefined) {
          // Convert camelCase to snake_case for SQL
          const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          
          // Special handling for customerId to ensure it's stored as customer_id
          const columnName = key === 'customerId' ? 'customer_id' : snakeKey;
          
          // Handle date fields for correct timestamp conversion
          if (key === 'eventDate' || key === 'endDate') {
            if (value instanceof Date) {
              updates.push(`${columnName} = $${paramIndex}`);
              values.push(value);
            } else if (typeof value === 'string') {
              updates.push(`${columnName} = $${paramIndex}`);
              values.push(new Date(value));
            }
          } else {
            updates.push(`${columnName} = $${paramIndex}`);
            values.push(value);
          }
          
          paramIndex++;
        }
      }
      
      // Add updated_at timestamp
      updates.push(`updated_at = $${paramIndex}`);
      values.push(new Date());
      
      // Construct SQL query
      const sql = `
        UPDATE events 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex + 1}
        RETURNING *
      `;
      
      // Add ID as the last parameter
      values.push(id);
      
      console.log('Executing update SQL:', sql);
      console.log('With parameters:', values);
      
      // Execute the update query
      const result = await client.query(sql, values);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      // Convert snake_case to camelCase for frontend consumption
      const eventRecord = result.rows[0];
      const camelCaseEvent = Object.entries(eventRecord).reduce((acc, [key, value]) => {
        // Convert snake_case to camelCase
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        acc[camelKey] = value;
        return acc;
      }, {} as Record<string, any>);
      
      // Handle date fields
      if (eventRecord.event_date) {
        camelCaseEvent.eventDate = new Date(eventRecord.event_date);
      }
      
      if (eventRecord.end_date) {
        camelCaseEvent.endDate = new Date(eventRecord.end_date);
      }
      
      if (eventRecord.created_at) {
        camelCaseEvent.createdAt = new Date(eventRecord.created_at);
      }
      
      if (eventRecord.updated_at) {
        camelCaseEvent.updatedAt = new Date(eventRecord.updated_at);
      }
      
      console.log('Updated event:', camelCaseEvent);
      return camelCaseEvent as unknown as Event;
    } finally {
      client.release();
    }
  }

  async getEvents(filters?: Partial<Event>): Promise<Event[]> {
    try {
      // Using direct SQL query to avoid enum issues
      const client = await pool.connect();
      try {
        let sql = `SELECT * FROM events`;
        const params: any[] = [];
        let paramIndex = 1;
        
        if (filters && Object.keys(filters).length > 0) {
          const conditions: string[] = [];
          
          for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined) {
              // Convert camelCase keys to snake_case for SQL
              const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
              
              // Special handling for customerId to check both column formats
              if (key === 'customerId') {
                console.log(`Adding customer_id filter for user ID: ${value}`);
                
                // Always ensure we're using the correct column name
                conditions.push(`(customer_id = $${paramIndex})`);
                params.push(value);
                paramIndex++;
                
                // For security, log which customer is accessing events
                console.log(`SECURITY: Filtered events to only show customer_id = ${value}`);
              }
              // Check if we're trying to filter on status with array values
              else if (key === 'status' && Array.isArray(value)) {
                const statusParams = value.map((_, i) => `$${paramIndex + i}`).join(', ');
                conditions.push(`${snakeCaseKey} IN (${statusParams})`);
                params.push(...value);
                paramIndex += value.length;
              } else {
                conditions.push(`${snakeCaseKey} = $${paramIndex}`);
                params.push(value);
                paramIndex++;
              }
            }
          }
          
          if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(' AND ')}`;
          }
        }
        
        console.log('Executing SQL query for events:', sql);
        console.log('SQL query parameters:', params);
        
        // Debug the DB schema if needed
        const columnsResult = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'events'
        `);
        console.log('Events table columns:', columnsResult.rows);
        
        // Get all events to debug filtering
        const allEventsResult = await client.query('SELECT id, name, customer_id FROM events');
        console.log('All events in database:', allEventsResult.rows);
        
        if (filters && filters.customerId) {
          console.log('Direct SQL query to validate customer filtering:');
          const directCustomerQuery = await client.query(
            'SELECT * FROM events WHERE customer_id = $1', 
            [filters.customerId]
          );
          console.log(`Direct SQL query found ${directCustomerQuery.rowCount} events for customer ${filters.customerId}`);
        }
        
        const result = await client.query(sql, params);
        console.log(`Returning ${result.rowCount} events to client`)
        
        // Process date fields in the results
        const processedEvents = result.rows.map(event => {
          // Convert snake_case to camelCase for the entire object
          const camelCaseEvent = Object.entries(event).reduce((acc, [key, value]) => {
            // Convert snake_case to camelCase
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            acc[camelKey] = value;
            return acc;
          }, {} as Record<string, any>);
          
          // Explicitly handle date fields
          if (event.event_date) {
            camelCaseEvent.eventDate = new Date(event.event_date);
          }
          
          if (event.end_date) {
            camelCaseEvent.endDate = new Date(event.end_date);
          }
          
          return camelCaseEvent;
        });
        
        console.log('Processed events from DB:', processedEvents);
        return processedEvents as unknown as Event[];
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error retrieving events:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Database connection is required for application functionality');
      
      // Return empty array rather than mock data
      return [];
    }
  }

  // Activity methods
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    try {
      const client = await pool.connect();
      try {
        // Get the max ID to ensure we generate a unique one
        const maxIdResult = await client.query('SELECT MAX(id) FROM activities');
        const maxId = maxIdResult.rows[0].max || 0;
        const newId = maxId + 1;
        
        // Prepare column names and values for the SQL statement
        const columns = ['id'];
        const placeholders = ['$1'];
        const values = [newId];
        let paramIndex = 2;
        
        // Add activity fields
        if (insertActivity.userId !== undefined) {
          columns.push('user_id');
          placeholders.push(`$${paramIndex++}`);
          values.push(insertActivity.userId);
        }
        
        columns.push('activity_type');
        placeholders.push(`$${paramIndex++}`);
        values.push(insertActivity.activityType);
        
        columns.push('description');
        placeholders.push(`$${paramIndex++}`);
        values.push(insertActivity.description);
        
        if (insertActivity.entityId !== undefined) {
          columns.push('entity_id');
          placeholders.push(`$${paramIndex++}`);
          values.push(insertActivity.entityId);
        }
        
        if (insertActivity.entityType !== undefined) {
          columns.push('entity_type');
          placeholders.push(`$${paramIndex++}`);
          values.push(insertActivity.entityType);
        }
        
        if (insertActivity.data !== undefined) {
          columns.push('data');
          placeholders.push(`$${paramIndex++}`);
          values.push(insertActivity.data);
        }
        
        // Add created_at timestamp
        columns.push('created_at');
        placeholders.push(`$${paramIndex++}`);
        values.push(new Date());
        
        // Construct SQL query
        const sql = `
          INSERT INTO activities (${columns.join(', ')}) 
          VALUES (${placeholders.join(', ')})
          RETURNING *
        `;
        
        // Execute the query
        const result = await client.query(sql, values);
        
        if (result.rows.length === 0) {
          throw new Error('Failed to create activity');
        }
        
        // Convert snake_case to camelCase for frontend consumption
        const activityRecord = result.rows[0];
        const camelCaseActivity = Object.entries(activityRecord).reduce((acc, [key, value]) => {
          // Convert snake_case to camelCase
          const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          acc[camelKey] = value;
          return acc;
        }, {} as Record<string, any>);
        
        // Handle date fields
        if (activityRecord.created_at) {
          camelCaseActivity.createdAt = new Date(activityRecord.created_at);
        }
        
        return camelCaseActivity as Activity;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating activity:', error);
      // Fail with an error for activity creation
      throw new Error('Failed to create activity log. Database connection error.');
    }
  }

  async getActivities(limit?: number): Promise<Activity[]> {
    // Using direct SQL query to avoid TypeScript errors
    const client = await pool.connect();
    try {
      const sql = limit && limit > 0
        ? `SELECT * FROM activities ORDER BY created_at DESC LIMIT $1`
        : `SELECT * FROM activities ORDER BY created_at DESC`;
        
      const params = limit && limit > 0 ? [limit] : [];
      const result = await client.query(sql, params);
      return result.rows as unknown as Activity[];
    } finally {
      client.release();
    }
  }
  
  // Proposal methods
  async getProposal(id: number): Promise<Proposal | undefined> {
    try {
      const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id));
      return proposal;
    } catch (error) {
      console.error('Error getting proposal by ID:', error instanceof Error ? error.message : 'Unknown error');
      return undefined;
    }
  }
  
  async getEventProposals(eventId: number): Promise<Proposal[]> {
    try {
      const proposalsList = await db.select()
        .from(proposals)
        .where(eq(proposals.eventId, eventId))
        .orderBy(desc(proposals.createdAt));
      
      return proposalsList;
    } catch (error) {
      console.error('Error getting event proposals:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }
  
  async createProposal(insertProposal: InsertProposal): Promise<Proposal> {
    try {
      // Use direct SQL to bypass Drizzle typing issues
      const client = await pool.connect();
      try {
        // Process data to ensure proper types for the database
        const processedData = {
          ...insertProposal,
          status: insertProposal.status ?? 'draft',
          // Convert totalPrice to string for numeric column
          totalPrice: insertProposal.totalPrice.toString(),
          // Ensure items is properly formatted as JSON string for JSONB column
          items: typeof insertProposal.items === 'string' 
            ? insertProposal.items 
            : JSON.stringify(insertProposal.items),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        console.log('Items data type:', typeof processedData.items);
        console.log('Items value:', processedData.items);
        
        // Prepare column names and values for the SQL statement
        const columns: string[] = [];
        const placeholders: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        
        // Process all keys in the insertion data
        for (const [key, value] of Object.entries(processedData)) {
          if (value !== undefined) {
            // Convert camelCase to snake_case for SQL
            const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            
            // Special handling for IDs to ensure they're stored with snake_case
            let columnName = snakeKey;
            if (key === 'customerId') columnName = 'customer_id';
            if (key === 'eventId') columnName = 'event_id';
            if (key === 'adminId') columnName = 'admin_id';
            if (key === 'talentId') columnName = 'talent_id';
            
            columns.push(columnName);
            placeholders.push(`$${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        }
        
        // Construct SQL query
        const sql = `
          INSERT INTO proposals (${columns.join(', ')}) 
          VALUES (${placeholders.join(', ')})
          RETURNING *
        `;
        
        console.log('Executing SQL insert for proposal:', sql);
        console.log('With parameters:', values);
        
        // Execute the query
        const result = await client.query(sql, values);
        
        if (result.rows.length === 0) {
          throw new Error('Failed to create proposal');
        }
        
        // Convert snake_case to camelCase for frontend consumption
        const proposalRecord = result.rows[0];
        const camelCaseProposal = Object.entries(proposalRecord).reduce((acc, [key, value]) => {
          // Convert snake_case to camelCase
          const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          acc[camelKey] = value;
          return acc;
        }, {} as Record<string, any>);
        
        // Handle date fields
        if (proposalRecord.created_at) {
          camelCaseProposal.createdAt = new Date(proposalRecord.created_at);
        }
        
        if (proposalRecord.updated_at) {
          camelCaseProposal.updatedAt = new Date(proposalRecord.updated_at);
        }
        
        if (proposalRecord.valid_until) {
          camelCaseProposal.validUntil = new Date(proposalRecord.valid_until);
        }
        
        return camelCaseProposal as Proposal;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating proposal:', error instanceof Error ? error.message : 'Unknown error');
      throw new Error('Failed to create proposal. Database connection error.');
    }
  }
  
  async updateProposal(id: number, proposalData: Partial<InsertProposal>): Promise<Proposal | undefined> {
    try {
      // Execute direct SQL update to handle snake_case/camelCase correctly
      const client = await pool.connect();
      try {
        // Process data to ensure proper types for the database
        const processedData: Record<string, any> = {
          ...proposalData,
          updatedAt: new Date()
        };
        
        // Convert totalPrice to string if present
        if (processedData.totalPrice !== undefined) {
          processedData.totalPrice = processedData.totalPrice.toString();
        }
        
        // Ensure items is properly formatted as JSON string for JSONB column
        if (processedData.items !== undefined) {
          processedData.items = typeof processedData.items === 'string' 
            ? processedData.items 
            : JSON.stringify(processedData.items);
        }
        
        // Prepare column updates
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        
        // Create SET clause for SQL statement
        for (const [key, value] of Object.entries(processedData)) {
          if (value !== undefined) {
            // Convert camelCase to snake_case for SQL
            const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            
            // Special handling for IDs to ensure they're stored with snake_case
            let columnName = snakeKey;
            if (key === 'customerId') columnName = 'customer_id';
            if (key === 'eventId') columnName = 'event_id';
            if (key === 'adminId') columnName = 'admin_id';
            if (key === 'talentId') columnName = 'talent_id';
            
            updates.push(`${columnName} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        }
        
        if (updates.length === 0) {
          console.log('No fields to update for proposal');
          return undefined;
        }
        
        // Construct SQL query
        const sql = `
          UPDATE proposals 
          SET ${updates.join(', ')} 
          WHERE id = $${paramIndex}
          RETURNING *
        `;
        
        // Add ID as the last parameter
        values.push(id);
        
        console.log('Executing update SQL for proposal:', sql);
        console.log('With parameters:', values);
        
        // Execute the update query
        const result = await client.query(sql, values);
        
        if (result.rows.length === 0) {
          return undefined;
        }
        
        // Convert snake_case to camelCase for frontend consumption
        const proposalRecord = result.rows[0];
        const camelCaseProposal = Object.entries(proposalRecord).reduce((acc, [key, value]) => {
          // Convert snake_case to camelCase
          const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          acc[camelKey] = value;
          return acc;
        }, {} as Record<string, any>);
        
        // Handle date fields
        if (proposalRecord.created_at) {
          camelCaseProposal.createdAt = new Date(proposalRecord.created_at);
        }
        
        if (proposalRecord.updated_at) {
          camelCaseProposal.updatedAt = new Date(proposalRecord.updated_at);
        }
        
        if (proposalRecord.valid_until) {
          camelCaseProposal.validUntil = new Date(proposalRecord.valid_until);
        }
        
        return camelCaseProposal as Proposal;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating proposal:', error instanceof Error ? error.message : 'Unknown error');
      return undefined;
    }
  }
  
  // Notification methods
  async createNotification(notification: {
    userId: number;
    type: string;
    title: string;
    message: string;
    redirectUrl?: string;
  }): Promise<any> {
    try {
      console.log('Creating notification:', notification);
      
      const client = await pool.connect();
      try {
        // Check if notifications table exists and its structure
        const tableCheckResult = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'notifications'
          )
        `);
        
        if (!tableCheckResult.rows[0].exists) {
          console.error('Notifications table does not exist');
          throw new Error('Notifications table does not exist');
        }
        
        // Get column information to determine which fields we can use
        const columnsResult = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'notifications'
        `);
        
        const columnNames = columnsResult.rows.map(row => row.column_name);
        console.log('Available notification columns:', columnNames);
        
        // Prepare query based on available columns
        const columns = ['user_id', 'type', 'title', 'message', 'is_read', 'created_at'];
        const values = [notification.userId, notification.type, notification.title, notification.message, false, new Date()];
        const placeholders = ['$1', '$2', '$3', '$4', '$5', '$6'];
        let paramIndex = 7;
        
        // Add redirect_url if available in schema
        if (columnNames.includes('redirect_url') && notification.redirectUrl) {
          columns.push('redirect_url');
          values.push(notification.redirectUrl);
          placeholders.push(`$${paramIndex++}`);
        }
        
        // Construct and execute query
        const query = `
          INSERT INTO notifications (${columns.join(', ')})
          VALUES (${placeholders.join(', ')})
          RETURNING *
        `;
        
        const result = await client.query(query, values);
        console.log('Notification created:', result.rows[0]);
        
        return result.rows[0];
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating notification:', error instanceof Error ? error.message : 'Unknown error');
      // Don't throw error to prevent API failure if notification creation fails
      return null;
    }
  }
}

// Export database storage instance
export const storage = new DatabaseStorage();