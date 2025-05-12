import { eq, and, or, desc, asc, sql, inArray } from 'drizzle-orm';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import {
  authUsers, adminProfiles, employeeProfiles, customerProfiles, providerProfiles,
  events, services, portfolioItems, proposals, bookings, reviews, activities,
  type AuthUser, type InsertAuthUser, 
  type CustomerProfile, type ProviderProfile, 
  type Event, type InsertEvent,
  type Service, type InsertService,
  type Proposal, type InsertProposal,
  type Activity, type InsertActivity,
  type Booking
} from '@shared/new-schema';
import { db, pool } from './new-db.js';

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<AuthUser | undefined>;
  getUserByUsername(username: string): Promise<(AuthUser & { profileId?: number }) | undefined>;
  createUser(user: InsertAuthUser & { role: string }): Promise<AuthUser & { profileId?: number }>;
  updateUser(id: number, user: Partial<InsertAuthUser>): Promise<AuthUser | undefined>;
  getUsers(filters?: Partial<AuthUser>): Promise<AuthUser[]>;
  
  // Profile operations
  getCustomerProfile(id: number): Promise<CustomerProfile | undefined>;
  getProviderProfile(id: number): Promise<ProviderProfile | undefined>;
  
  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  getEvents(filters?: Partial<Event>): Promise<Event[]>;
  
  // Activity operations
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivities(limit?: number): Promise<Activity[]>;
  
  // Service operations
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  
  // Proposal operations
  getProposal(id: number): Promise<Proposal | undefined>;
  getEventProposals(eventId: number): Promise<Proposal[]>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposal(id: number, proposal: Partial<InsertProposal>): Promise<Proposal | undefined>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      tableName: 'session',
      createTableIfMissing: true
    });
    
    console.log('Initialized PostgreSQL session store');
  }
  
  // Auth User Operations
  async getUser(id: number): Promise<AuthUser | undefined> {
    const [user] = await db.select().from(authUsers).where(eq(authUsers.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<(AuthUser & { profileId?: number }) | undefined> {
    const [user] = await db.select().from(authUsers).where(eq(authUsers.username, username));
    
    if (!user) return undefined;
    
    // Get profile id based on user role
    let profileId;
    
    if (user.role === 'admin') {
      const [profile] = await db.select().from(adminProfiles).where(eq(adminProfiles.userId, user.id));
      if (profile) profileId = profile.id;
    } else if (user.role === 'employee') {
      const [profile] = await db.select().from(employeeProfiles).where(eq(employeeProfiles.userId, user.id));
      if (profile) profileId = profile.id;
    } else if (user.role === 'customer') {
      const [profile] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, user.id));
      if (profile) profileId = profile.id;
    } else if (user.role === 'provider') {
      const [profile] = await db.select().from(providerProfiles).where(eq(providerProfiles.userId, user.id));
      if (profile) profileId = profile.id;
    }
    
    return { ...user, profileId };
  }
  
  async createUser(insertUser: InsertAuthUser & { role: string }): Promise<AuthUser & { profileId?: number }> {
    const [user] = await db
      .insert(authUsers)
      .values({
        ...insertUser,
        status: 'active',
        emailVerification: 'verified'
      })
      .returning();
    
    // Create a default profile based on role
    let profileId;
    
    if (user.role === 'admin') {
      const [profile] = await db
        .insert(adminProfiles)
        .values({
          userId: user.id,
          fullName: insertUser.username,
        })
        .returning();
      
      if (profile) profileId = profile.id;
    } else if (user.role === 'employee') {
      const [profile] = await db
        .insert(employeeProfiles)
        .values({
          userId: user.id,
          fullName: insertUser.username,
        })
        .returning();
      
      if (profile) profileId = profile.id;
    } else if (user.role === 'customer') {
      const [profile] = await db
        .insert(customerProfiles)
        .values({
          userId: user.id,
          fullName: insertUser.username,
        })
        .returning();
      
      if (profile) profileId = profile.id;
    } else if (user.role === 'provider') {
      const [profile] = await db
        .insert(providerProfiles)
        .values({
          userId: user.id,
          businessName: insertUser.username,
          contactName: insertUser.username,
        })
        .returning();
      
      if (profile) profileId = profile.id;
    }
    
    return { ...user, profileId };
  }
  
  async updateUser(id: number, userData: Partial<InsertAuthUser>): Promise<AuthUser | undefined> {
    const [user] = await db
      .update(authUsers)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(authUsers.id, id))
      .returning();
    
    return user;
  }
  
  async getUsers(filters?: Partial<AuthUser>): Promise<AuthUser[]> {
    let query = db.select().from(authUsers);
    
    if (filters) {
      if (filters.role) {
        query = query.where(eq(authUsers.role, filters.role));
      }
      if (filters.status) {
        query = query.where(eq(authUsers.status, filters.status));
      }
    }
    
    return await query;
  }
  
  // Profile Operations
  async getCustomerProfile(id: number): Promise<CustomerProfile | undefined> {
    const [profile] = await db.select().from(customerProfiles).where(eq(customerProfiles.id, id));
    return profile;
  }
  
  async getProviderProfile(id: number): Promise<ProviderProfile | undefined> {
    const [profile] = await db.select().from(providerProfiles).where(eq(providerProfiles.id, id));
    return profile;
  }
  
  // Event Operations
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }
  
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(insertEvent)
      .returning();
    
    return event;
  }
  
  async updateEvent(id: number, eventData: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set({
        ...eventData,
        updatedAt: new Date()
      })
      .where(eq(events.id, id))
      .returning();
    
    return event;
  }
  
  async getEvents(filters?: Partial<Event>): Promise<Event[]> {
    // Debug the columns in the events table
    try {
      const columnsResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'events'
      `);
      console.log('Events table columns:', columnsResult.rows);
    } catch (error) {
      console.error('Error fetching table schema:', error);
    }
    
    // First, attempt to get all events for debugging
    try {
      const allEvents = await db.select().from(events);
      console.log('All events in database:', allEvents);
      
      let query = db.select().from(events);
      
      if (filters) {
        const conditions = [];
        
        if (filters.customerId) {
          conditions.push(eq(events.customerId, filters.customerId));
        }
        
        if (filters.status) {
          if (Array.isArray(filters.status)) {
            conditions.push(inArray(events.status, filters.status));
            
            // Log SQL query details for debugging
            console.log('Executing SQL query for events:', `SELECT * FROM events WHERE status IN (${filters.status.map((_, i) => `$${i+1}`).join(', ')})`);
            console.log('SQL query parameters:', filters.status);
          } else {
            conditions.push(eq(events.status, filters.status));
          }
        }
        
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
      }
      
      const results = await query;
      console.log('Processed events from DB:', results);
      return results;
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }
  
  // Activity Operations
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    
    return activity;
  }
  
  async getActivities(limit?: number): Promise<Activity[]> {
    let query = db
      .select()
      .from(activities)
      .orderBy(desc(activities.createdAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }
  
  // Service Operations
  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }
  
  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(insertService)
      .returning();
    
    return service;
  }
  
  async updateService(id: number, serviceData: Partial<InsertService>): Promise<Service | undefined> {
    const [service] = await db
      .update(services)
      .set({
        ...serviceData,
        updatedAt: new Date()
      })
      .where(eq(services.id, id))
      .returning();
    
    return service;
  }
  
  // Proposal Operations
  async getProposal(id: number): Promise<Proposal | undefined> {
    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id));
    return proposal;
  }
  
  async getEventProposals(eventId: number): Promise<Proposal[]> {
    return await db.select().from(proposals).where(eq(proposals.eventId, eventId));
  }
  
  async createProposal(insertProposal: InsertProposal): Promise<Proposal> {
    const [proposal] = await db
      .insert(proposals)
      .values(insertProposal)
      .returning();
    
    return proposal;
  }
  
  async updateProposal(id: number, proposalData: Partial<InsertProposal>): Promise<Proposal | undefined> {
    const [proposal] = await db
      .update(proposals)
      .set({
        ...proposalData,
        updatedAt: new Date()
      })
      .where(eq(proposals.id, id))
      .returning();
    
    return proposal;
  }
}

export const storage = new DatabaseStorage();