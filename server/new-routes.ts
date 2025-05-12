import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { eq, and, or, desc, sql, inArray } from 'drizzle-orm';
import { 
  adminProfiles, employeeProfiles, customerProfiles, providerProfiles, 
  events, services, portfolioItems, proposals, bookings, reviews, 
  authUsers, activities,
  insertCustomerProfileSchema, insertProviderProfileSchema, 
  insertEventSchema, insertServiceSchema, insertPortfolioItemSchema,
  insertProposalSchema, insertBookingSchema, insertReviewSchema
} from "@shared/new-schema";
import { db } from "./new-db";
import { storage } from "./new-storage";
import { setupAuth } from "./new-auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);
  
  // API Routes

  // Get user profile based on role
  app.get("/api/profile", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const user = req.user;
      let profile;
      
      if (user.role === 'admin') {
        [profile] = await db.select().from(adminProfiles).where(eq(adminProfiles.userId, user.id));
      } else if (user.role === 'employee') {
        [profile] = await db.select().from(employeeProfiles).where(eq(employeeProfiles.userId, user.id));
      } else if (user.role === 'customer') {
        [profile] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, user.id));
      } else if (user.role === 'provider') {
        [profile] = await db.select().from(providerProfiles).where(eq(providerProfiles.userId, user.id));
      }
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json({ ...profile, role: user.role });
    } catch (error) {
      next(error);
    }
  });
  
  // Update user profile
  app.post("/api/profile", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const user = req.user;
      let profile;
      
      if (user.role === 'customer') {
        // Validate customer profile data
        const validation = insertCustomerProfileSchema.safeParse(req.body);
        if (!validation.success) {
          const validationError = fromZodError(validation.error);
          return res.status(400).json({ message: validationError.message });
        }
        
        // Update customer profile
        [profile] = await db.update(customerProfiles)
          .set({
            ...validation.data,
            updatedAt: new Date()
          })
          .where(eq(customerProfiles.userId, user.id))
          .returning();
        
      } else if (user.role === 'provider') {
        // Validate provider profile data
        const validation = insertProviderProfileSchema.safeParse(req.body);
        if (!validation.success) {
          const validationError = fromZodError(validation.error);
          return res.status(400).json({ message: validationError.message });
        }
        
        // Update provider profile
        [profile] = await db.update(providerProfiles)
          .set({
            ...validation.data,
            updatedAt: new Date()
          })
          .where(eq(providerProfiles.userId, user.id))
          .returning();
      }
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      // Create activity for profile update
      await storage.createActivity({
        userId: user.id,
        activityType: 'profile_update',
        description: `${user.role} profile updated`,
        entityId: user.id,
        entityType: 'user'
      });
      
      res.json(profile);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });
  
  // Get all users (admin only)
  app.get("/api/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      // Only admin and employees can list all users
      if (req.user.role !== 'admin' && req.user.role !== 'employee') {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      const users = await storage.getUsers();
      
      // Map users to include profile info
      const enhancedUsers = await Promise.all(users.map(async (user) => {
        let profile;
        
        if (user.role === 'admin') {
          [profile] = await db.select().from(adminProfiles).where(eq(adminProfiles.userId, user.id));
        } else if (user.role === 'employee') {
          [profile] = await db.select().from(employeeProfiles).where(eq(employeeProfiles.userId, user.id));
        } else if (user.role === 'customer') {
          [profile] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, user.id));
        } else if (user.role === 'provider') {
          [profile] = await db.select().from(providerProfiles).where(eq(providerProfiles.userId, user.id));
        }
        
        // Return a user object without the password
        const { password, ...userWithoutPassword } = user;
        
        return {
          ...userWithoutPassword,
          profile: profile || {}
        };
      }));
      
      res.json(enhancedUsers);
    } catch (error) {
      next(error);
    }
  });
  
  // Get activities
  app.get("/api/activities", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const activities = await storage.getActivities(limit);
      
      res.json(activities);
    } catch (error) {
      next(error);
    }
  });
  
  // Event Routes
  
  // Get all events (with filtering based on user role)
  app.get("/api/events", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const user = req.user;
      const filters = {};
      
      // If user is a customer, only show their events
      if (user.role === 'customer' && user.profileId) {
        console.log(`Customer user ${user.id} requesting their events with profileId ${user.profileId}`);
        
        // Find all events for this customer
        try {
          const customerEvents = await db.select()
            .from(events)
            .where(eq(events.customerId, user.profileId));
            
          console.log(`Direct SQL query found ${customerEvents.length} events for customer ${user.profileId}`);
          console.log('Returning', customerEvents.length, 'events to client');
          
          return res.json(customerEvents);
        } catch (error) {
          console.error('Error executing direct query for customer events:', error);
          return res.status(500).json({ message: "Error fetching events" });
        }
      }
      
      // Admin/Provider users can see events with filters
      console.log(`Admin/Provider user ${user.id} requesting all events`);
      
      // Apply any filters from query params
      if (req.query.status) {
        let statuses;
        if (typeof req.query.status === 'string') {
          statuses = [req.query.status];
        } else {
          statuses = req.query.status;
        }
        
        console.log('Applying event filters:', { status: statuses });
        Object.assign(filters, { status: statuses });
      }
      
      const allEvents = await storage.getEvents(filters);
      console.log('Processed events from DB:', allEvents);
      
      res.json(allEvents);
    } catch (error) {
      console.error('Error in /api/events endpoint:', error);
      next(error);
    }
  });
  
  // Get customer-specific events
  app.get("/api/customer/events", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      if (req.user.role !== 'customer') {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      // Using user.profileId (customer profile id)
      if (req.user.profileId) {
        const customerEvents = await db.select()
          .from(events)
          .where(eq(events.customerId, req.user.profileId));
          
        console.log('Returning', customerEvents.length, 'events to client');
        return res.json(customerEvents);
      } else {
        return res.json([]);
      }
    } catch (error) {
      console.error('Error in /api/customer/events endpoint:', error);
      next(error);
    }
  });
  
  // Create a new event (customer only)
  app.post("/api/customer/events", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      if (req.user.role !== 'customer' || !req.user.profileId) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      // Validate event data
      const validation = insertEventSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      // Create new event
      const eventData = {
        ...validation.data,
        customerId: req.user.profileId,
        status: 'pending'
      };
      
      const newEvent = await storage.createEvent(eventData);
      
      // Create activity for event creation
      await storage.createActivity({
        userId: req.user.id,
        activityType: 'event_create',
        description: `New event created: ${newEvent.name}`,
        entityId: newEvent.id,
        entityType: 'event'
      });
      
      res.status(201).json(newEvent);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });
  
  // Update an event
  app.put("/api/events/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const eventId = parseInt(req.params.id);
      const existingEvent = await storage.getEvent(eventId);
      
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Check authorization: customers can only update their own events,
      // admins/employees can update any event
      if (req.user.role === 'customer' && req.user.profileId !== existingEvent.customerId) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      // Validate event data
      const validation = insertEventSchema.partial().safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      // Update event
      const updatedEvent = await storage.updateEvent(eventId, validation.data);
      
      // Create activity for event update
      await storage.createActivity({
        userId: req.user.id,
        activityType: 'event_update',
        description: `Event updated: ${updatedEvent?.name}`,
        entityId: eventId,
        entityType: 'event'
      });
      
      res.json(updatedEvent);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });
  
  // Get dashboard statistics (admin/employee only)
  app.get("/api/dashboard/stats", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      // Only admin and employees can access dashboard stats
      if (req.user.role !== 'admin' && req.user.role !== 'employee') {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      // Count total users
      const userCount = await db.select({ count: sql`count(*)` }).from(authUsers);
      const totalUsers = Number(userCount[0]?.count || 0);
      
      // Count events by status
      const pendingEvents = await db.select({ count: sql`count(*)` })
        .from(events)
        .where(eq(events.status, 'pending'));
      
      const activeEvents = await db.select({ count: sql`count(*)` })
        .from(events)
        .where(or(
          eq(events.status, 'confirmed'),
          eq(events.status, 'in_progress')
        ));
      
      // Calculate monthly revenue from proposals
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const monthlyRevenueResult = await db.select({ sum: sql`sum(total_price)` })
        .from(proposals)
        .where(and(
          eq(proposals.status, 'accepted'),
          sql`created_at >= ${thisMonth.toISOString()}`
        ));
      
      const monthlyRevenue = Number(monthlyRevenueResult[0]?.sum || 0);
      
      // Count pending proposals
      const pendingProposals = await db.select({ count: sql`count(*)` })
        .from(proposals)
        .where(eq(proposals.status, 'pending'));
      
      const pendingApprovals = Number(pendingProposals[0]?.count || 0);
      
      // Get recent users and events
      const recentUsers = await db.select()
        .from(authUsers)
        .orderBy(desc(authUsers.createdAt))
        .limit(5);
      
      const recentEvents = await db.select()
        .from(events)
        .orderBy(desc(events.createdAt))
        .limit(5);
      
      res.json({
        totalUsers,
        activeEvents: Number(activeEvents[0]?.count || 0),
        pendingEvents: Number(pendingEvents[0]?.count || 0),
        monthlyRevenue,
        pendingApprovals,
        recentUsers,
        recentEvents
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Service Routes
  
  // Get provider services
  app.get("/api/providers/services", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      // For providers, get their own services. For others, require a provider_id
      const providerId = req.query.provider_id ? parseInt(req.query.provider_id as string) : 
                        (req.user.role === 'provider' && req.user.profileId ? req.user.profileId : null);
      
      if (providerId === null) {
        return res.status(400).json({ message: "Provider ID is required" });
      }
      
      // Get services
      const providerServices = await db.select()
        .from(services)
        .where(eq(services.providerId, providerId));
      
      res.json(providerServices);
    } catch (error) {
      next(error);
    }
  });
  
  // Create or update provider service
  app.post("/api/providers/services", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      // Only providers can create/update their own services
      if (req.user.role !== 'provider' || !req.user.profileId) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      // Validate input
      const validation = insertServiceSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      let service;
      const serviceData = {
        ...validation.data,
        providerId: req.user.profileId,
        updatedAt: new Date()
      };
      
      // Check if updating existing service
      if (req.body.id) {
        // Verify service belongs to this provider
        const [existingService] = await db.select()
          .from(services)
          .where(eq(services.id, req.body.id));
        
        if (!existingService || existingService.providerId !== req.user.profileId) {
          return res.status(403).json({ message: "Unauthorized access" });
        }
        
        // Update service
        [service] = await db.update(services)
          .set(serviceData)
          .where(eq(services.id, req.body.id))
          .returning();
      } else {
        // Create new service
        [service] = await db.insert(services)
          .values(serviceData)
          .returning();
      }
      
      // Create activity for service update
      await storage.createActivity({
        userId: req.user.id,
        activityType: 'service_update',
        description: `Provider service ${req.body.id ? 'updated' : 'created'}: ${service.title}`,
        entityId: service.id,
        entityType: 'service'
      });
      
      res.json(service);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });
  
  // Proposal Routes
  
  // Get event proposals
  app.get("/api/events/:eventId/proposals", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const eventId = parseInt(req.params.eventId);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Check authorization: customers can only view their own event proposals,
      // admins/employees can view any proposal
      if (req.user.role === 'customer' && req.user.profileId !== event.customerId) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      const eventProposals = await storage.getEventProposals(eventId);
      res.json(eventProposals);
    } catch (error) {
      next(error);
    }
  });
  
  // Create or update proposal (admin/employee only)
  app.post("/api/proposals", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      // Only admin and employees can create/update proposals
      if (req.user.role !== 'admin' && req.user.role !== 'employee') {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      if (!req.user.profileId) {
        return res.status(400).json({ message: "Employee profile not found" });
      }
      
      // Validate input
      const validation = insertProposalSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      let proposal;
      
      // Check if event exists
      const event = await storage.getEvent(validation.data.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Check if updating existing proposal
      if (req.body.id) {
        const existingProposal = await storage.getProposal(req.body.id);
        
        if (!existingProposal) {
          return res.status(404).json({ message: "Proposal not found" });
        }
        
        // Update proposal
        proposal = await storage.updateProposal(req.body.id, {
          ...validation.data,
          employeeId: req.user.profileId,
        });
      } else {
        // Create new proposal
        proposal = await storage.createProposal({
          ...validation.data,
          employeeId: req.user.profileId,
          status: 'draft'
        });
      }
      
      // Create activity for proposal update
      await storage.createActivity({
        userId: req.user.id,
        activityType: 'proposal_update',
        description: `Proposal ${req.body.id ? 'updated' : 'created'} for event ${event.name}`,
        entityId: proposal.id,
        entityType: 'proposal'
      });
      
      res.status(req.body.id ? 200 : 201).json(proposal);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });
  
  // Update proposal status (customer only for accept/reject)
  app.post("/api/proposals/:id/status", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const proposalId = parseInt(req.params.id);
      const status = req.body.status;
      
      // Validate status
      if (!['draft', 'pending', 'accepted', 'rejected', 'expired'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const proposal = await storage.getProposal(proposalId);
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      
      // Get the associated event to check ownership
      const event = await storage.getEvent(proposal.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Authorization checks based on role and action
      if (req.user.role === 'customer') {
        // Customers can only accept or reject proposals for their own events
        if (req.user.profileId !== event.customerId) {
          return res.status(403).json({ message: "Unauthorized access" });
        }
        
        // Customers can only change status to accepted or rejected
        if (status !== 'accepted' && status !== 'rejected') {
          return res.status(403).json({ message: "Unauthorized status change" });
        }
      } else if (req.user.role === 'admin' || req.user.role === 'employee') {
        // Admins/employees can change to any status
      } else {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      // Update proposal status
      const updatedProposal = await storage.updateProposal(proposalId, {
        status,
        feedback: req.body.feedback
      });
      
      // Create activity for status update
      await storage.createActivity({
        userId: req.user.id,
        activityType: 'proposal_status_update',
        description: `Proposal status changed to ${status}`,
        entityId: proposalId,
        entityType: 'proposal',
        data: { feedback: req.body.feedback }
      });
      
      res.json(updatedProposal);
    } catch (error) {
      next(error);
    }
  });
  
  // Create the HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}