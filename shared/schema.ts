import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, jsonb, date, numeric, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define enums for various entity types
export const userRoleEnum = pgEnum('user_role', ['admin', 'employee', 'customer', 'provider']);
export const userStatusEnum = pgEnum('user_status', ['active', 'pending', 'rejected', 'inactive']);
export const eventStatusEnum = pgEnum('event_status', ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']);
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'declined', 'cancelled', 'completed']);
export const proposalStatusEnum = pgEnum('proposal_status', ['draft', 'pending', 'accepted', 'rejected', 'expired']);
export const serviceTypeEnum = pgEnum('service_type', [
  'entertainment', 'activity', 'media', 'stage', 'host', 'tent', 'food', 'retail', 
  'utilities', 'digital', 'special_zone'
]);
export const portfolioTypeEnum = pgEnum('portfolio_type', ['image', 'video', 'link']);
export const eventTypeEnum = pgEnum('event_type', [
  'business', 'entertainment', 'social', 'cultural', 'educational',
  'wellness', 'sports', 'government', 'nonprofit', 'trade', 'hybrid'
]);
export const eventVibeEnum = pgEnum('event_vibe', [
  'festive', 'family_friendly', 'corporate', 'networking', 'relaxing',
  'youthful', 'adventurous', 'cultural', 'artistic', 'elegant', 'kids', 'formal'
]);
export const locationTypeEnum = pgEnum('location_type', ['indoor', 'outdoor', 'hybrid']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default('customer'),
  status: userStatusEnum("status").notNull().default('pending'),
  phone: text("phone"),
  country: text("country"),
  city: text("city"),
  nationality: text("nationality"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLogin: timestamp("last_login"),
  avatarUrl: text("avatar_url"),
  isOrganization: boolean("is_organization").default(false),
  organizationName: text("organization_name"),
  bio: text("bio"),
});

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  customerId: integer("customer_id").notNull(),
  eventDate: timestamp("event_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  location: text("location"),
  locationType: locationTypeEnum("location_type"),
  eventType: eventTypeEnum("event_type"),
  vibe: eventVibeEnum("vibe"),
  audienceSize: integer("audience_size"),
  budget: numeric("budget", { precision: 10, scale: 2 }),
  status: eventStatusEnum("status").notNull().default('pending'),
  value: numeric("value", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Provider profiles table
export const providerProfiles = pgTable("provider_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  isGroup: boolean("is_group").default(false),
  groupName: text("group_name"),
  teamSize: integer("team_size"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  currentResidence: text("current_residence"),
  languages: text("languages").array(),
  viewCount: integer("view_count").default(0),
  rating: real("rating"),
  reviewCount: integer("review_count").default(0),
  verified: boolean("verified").default(false),
  featuredProvider: boolean("featured_provider").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Services offered by providers
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  serviceType: serviceTypeEnum("service_type").notNull(),
  serviceCategory: text("service_category").notNull(),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }),
  priceExclusions: text("price_exclusions"),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Provider availability calendar
export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull(),
  date: date("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  isBlocked: boolean("is_blocked").default(false),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Provider portfolio items
export const portfolioItems = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull(),
  serviceId: integer("service_id"),
  type: portfolioTypeEnum("type").notNull(),
  title: text("title"),
  description: text("description"),
  url: text("url").notNull(),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings for events
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  serviceId: integer("service_id").notNull(),
  providerId: integer("provider_id").notNull(),
  customerId: integer("customer_id").notNull(),
  status: bookingStatusEnum("status").default('pending'),
  requestDate: timestamp("request_date").defaultNow(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  agreePrice: numeric("agree_price", { precision: 10, scale: 2 }),
  platformFee: numeric("platform_fee", { precision: 10, scale: 2 }),
  specialInstructions: text("special_instructions"),
  contractPath: text("contract_path"),
  cancelReason: text("cancel_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews left by customers for providers
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  providerId: integer("provider_id").notNull(),
  customerId: integer("customer_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  providerResponse: text("provider_response"),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages between users
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  bookingId: integer("booking_id"),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity table for tracking actions in the system
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  activityType: text("activity_type").notNull(),
  description: text("description").notNull(),
  entityId: integer("entity_id"),
  entityType: text("entity_type"),
  data: jsonb("data"),  // For storing structured data
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment records
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  customerId: integer("customer_id").notNull(),
  providerId: integer("provider_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: numeric("platform_fee", { precision: 10, scale: 2 }),
  paymentMethod: text("payment_method"),
  transactionId: text("transaction_id"),
  status: text("status").notNull(),
  paymentDate: timestamp("payment_date"),
  invoicePath: text("invoice_path"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications for users
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  isRead: boolean("is_read").default(false),
  redirectUrl: text("redirect_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// System settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value"),
  dataType: text("data_type").notNull(),
  description: text("description"),
  updatedBy: integer("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Proposals for events
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  adminId: integer("admin_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  items: jsonb("items").notNull(), // JSON array of proposed services and items
  status: proposalStatusEnum("status").default('draft'),
  validUntil: timestamp("valid_until"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define schemas for insert operations
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertProviderProfileSchema = createInsertSchema(providerProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  reviewCount: true,
});

export const insertServiceSchema = createInsertSchema(services)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true
  })
  .partial({ providerId: true }); // Make providerId optional for auth flow

export const insertPortfolioItemSchema = createInsertSchema(portfolioItems).omit({
  id: true,
  createdAt: true
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});

// Create basic insert schema
const baseProposalSchema = createInsertSchema(proposals).omit({
  id: true, 
  createdAt: true,
  updatedAt: true
});

// Extend with custom validation
export const insertProposalSchema = baseProposalSchema.extend({
  // Make sure totalPrice is properly parsed to string or number
  totalPrice: z.union([
    z.string().transform(val => parseFloat(val)),
    z.number()
  ]),
  // Support multiple date formats for validUntil with better error handling
  validUntil: z.union([
    z.string().transform(val => {
      try {
        const date = new Date(val);
        // Check if the date is valid
        if (isNaN(date.getTime())) {
          // Return a default date (30 days from now) if parsing fails
          return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
        return date;
      } catch (e) {
        // Return a default date (30 days from now) if parsing fails
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    }), 
    z.date().optional().default(() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  ]).optional().default(() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  // Ensure items can be both string and array
  items: z.union([
    z.string().transform(val => {
      try { return JSON.parse(val); } 
      catch { return []; }
    }),
    z.array(z.any())
  ])
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertProviderProfile = z.infer<typeof insertProviderProfileSchema>;
export type ProviderProfile = typeof providerProfiles.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;
export type PortfolioItem = typeof portfolioItems.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Proposal = typeof proposals.$inferSelect;

// Login schema for validation
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;
