/**
 * Vega Show Platform - New Normalized Schema
 * -----------------------------------------
 * This schema creates a proper normalized database structure with:
 * - Separate authentication table
 * - Role-specific profile tables with foreign keys to auth users
 * - Clear separation of concerns for all entity types
 */

import { relations, sql } from "drizzle-orm";
import { 
  serial, text, integer, boolean, timestamp, pgTable, 
  varchar, date, pgEnum, primaryKey, json, unique, numeric, real
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// --- Enums ---

// User roles
export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'employee',
  'customer',
  'provider'
]);

// User status
export const userStatusEnum = pgEnum('user_status', [
  'active',
  'pending',
  'rejected',
  'inactive'
]);

// Email verification status
export const emailVerificationEnum = pgEnum('email_verification_status', [
  'pending',
  'verified',
  'failed',
  'unverified'
]);

// Event status
export const eventStatusEnum = pgEnum('event_status', [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled'
]);

// Event location type
export const eventLocationTypeEnum = pgEnum('location_type', [
  'indoor',
  'outdoor',
  'hybrid'
]);

// Event type
export const eventTypeEnum = pgEnum('event_type', [
  'business',
  'entertainment',
  'social',
  'cultural',
  'educational',
  'wellness',
  'sports',
  'government',
  'nonprofit',
  'trade',
  'hybrid'
]);

// Event vibe
export const eventVibeEnum = pgEnum('event_vibe', [
  'festive',
  'family_friendly',
  'corporate',
  'networking',
  'relaxing',
  'youthful',
  'adventurous',
  'cultural',
  'artistic',
  'elegant',
  'kids',
  'formal'
]);

// Proposal status
export const proposalStatusEnum = pgEnum('proposal_status', [
  'pending',
  'rejected',
  'draft',
  'accepted',
  'expired'
]);

// Service types
export const serviceTypeEnum = pgEnum('service_type', [
  'media',
  'entertainment',
  'host',
  'activity',
  'stage',
  'tent',
  'food',
  'retail',
  'utilities',
  'digital',
  'special_zone'
]);

// Booking status
export const bookingStatusEnum = pgEnum('booking_status', [
  'pending',
  'confirmed',
  'cancelled',
  'completed'
]);

// --- Authentication Users ---

export const authUsers = pgTable('auth_users', {
  id: serial('id').primaryKey(),
  role: userRoleEnum('role').notNull(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  status: userStatusEnum('status').default('active').notNull(),
  emailVerification: emailVerificationEnum('email_verification').default('unverified'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLogin: timestamp('last_login'),
});

// --- Profile Tables ---

// Admin profiles
export const adminProfiles = pgTable('admin_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => authUsers.id, { onDelete: 'cascade' }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  avatarUrl: varchar('avatar_url', { length: 255 }),
  department: varchar('department', { length: 50 }),
  jobTitle: varchar('job_title', { length: 50 }),
  bio: text('bio'),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Employee profiles
export const employeeProfiles = pgTable('employee_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => authUsers.id, { onDelete: 'cascade' }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  avatarUrl: varchar('avatar_url', { length: 255 }),
  department: varchar('department', { length: 50 }),
  jobTitle: varchar('job_title', { length: 50 }),
  bio: text('bio'),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Customer profiles
export const customerProfiles = pgTable('customer_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => authUsers.id, { onDelete: 'cascade' }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  avatarUrl: varchar('avatar_url', { length: 255 }),
  company: varchar('company', { length: 100 }),
  address: text('address'),
  city: varchar('city', { length: 50 }),
  country: varchar('country', { length: 50 }),
  preferredContact: varchar('preferred_contact', { length: 20 }),
  preferences: json('preferences'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Provider (talent) profiles
export const providerProfiles = pgTable('provider_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => authUsers.id, { onDelete: 'cascade' }).notNull().unique(),
  isGroup: boolean('is_group').default(false),
  groupName: text('group_name'),
  teamSize: integer('team_size'),
  contactName: text('contact_name'),
  contactPhone: text('contact_phone'),
  currentResidence: text('current_residence'),
  languages: text('languages').array(),
  viewCount: integer('view_count').default(0),
  rating: real('rating').default(0),
  reviewCount: integer('review_count').default(0),
  verified: boolean('verified').default(false),
  featuredProvider: boolean('featured_provider').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Events ---

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customerProfiles.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  eventDate: timestamp('event_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  startTime: text('start_time'),
  endTime: text('end_time'),
  location: text('location'),
  locationType: eventLocationTypeEnum('location_type'),
  eventType: eventTypeEnum('event_type'),
  vibe: eventVibeEnum('vibe'),
  audienceSize: integer('audience_size'),
  budget: numeric('budget'),
  status: eventStatusEnum('status').default('pending'),
  value: numeric('value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Services ---

export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  providerId: integer('provider_id').references(() => providerProfiles.id).notNull(),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description'),
  serviceType: serviceTypeEnum('service_type').notNull(),
  serviceCategory: varchar('service_category', { length: 50 }).notNull(),
  basePrice: varchar('base_price', { length: 50 }),
  priceExclusions: text('price_exclusions'),
  isAvailable: boolean('is_available').default(true),
  featuredImage: varchar('featured_image', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Proposals ---

export const proposals = pgTable('proposals', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  employeeId: integer('employee_id').references(() => employeeProfiles.id),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description').notNull(),
  totalPrice: varchar('total_price', { length: 50 }),
  status: proposalStatusEnum('status').default('draft'),
  items: json('items'),
  validUntil: date('valid_until'),
  feedback: text('feedback'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Bookings ---

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  customerId: integer('customer_id').references(() => customerProfiles.id).notNull(),
  providerId: integer('provider_id').references(() => providerProfiles.id).notNull(),
  serviceId: integer('service_id').references(() => services.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  price: varchar('price', { length: 50 }),
  status: bookingStatusEnum('status').default('pending'),
  specialRequirements: text('special_requirements'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Portfolio Items ---

export const portfolioItems = pgTable('portfolio_items', {
  id: serial('id').primaryKey(),
  providerId: integer('provider_id').references(() => providerProfiles.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description'),
  mediaUrl: varchar('media_url', { length: 255 }).notNull(),
  mediaType: varchar('media_type', { length: 20 }).notNull(),
  featured: boolean('featured').default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Reviews ---

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customerProfiles.id).notNull(),
  providerId: integer('provider_id').references(() => providerProfiles.id).notNull(),
  bookingId: integer('booking_id').references(() => bookings.id),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  serviceQuality: integer('service_quality'),
  communication: integer('communication'),
  valueForMoney: integer('value_for_money'),
  published: boolean('published').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Activities ---

export const activities = pgTable('activities', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => authUsers.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  description: text('description').notNull(),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: integer('entity_id'),
  data: json('data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Relations ---

export const authUsersRelations = relations(authUsers, ({ one }) => ({
  adminProfile: one(adminProfiles, {
    fields: [authUsers.id],
    references: [adminProfiles.userId],
  }),
  employeeProfile: one(employeeProfiles, {
    fields: [authUsers.id],
    references: [employeeProfiles.userId],
  }),
  customerProfile: one(customerProfiles, {
    fields: [authUsers.id],
    references: [customerProfiles.userId],
  }),
  providerProfile: one(providerProfiles, {
    fields: [authUsers.id],
    references: [providerProfiles.userId],
  }),
}));

export const customerProfilesRelations = relations(customerProfiles, ({ one, many }) => ({
  user: one(authUsers, {
    fields: [customerProfiles.userId],
    references: [authUsers.id],
  }),
  events: many(events),
  bookings: many(bookings),
  reviews: many(reviews),
}));

export const providerProfilesRelations = relations(providerProfiles, ({ one, many }) => ({
  user: one(authUsers, {
    fields: [providerProfiles.userId],
    references: [authUsers.id],
  }),
  services: many(services),
  portfolioItems: many(portfolioItems),
  bookings: many(bookings),
  reviews: many(reviews),
}));

export const adminProfilesRelations = relations(adminProfiles, ({ one }) => ({
  user: one(authUsers, {
    fields: [adminProfiles.userId],
    references: [authUsers.id],
  }),
}));

export const employeeProfilesRelations = relations(employeeProfiles, ({ one, many }) => ({
  user: one(authUsers, {
    fields: [employeeProfiles.userId],
    references: [authUsers.id],
  }),
  proposals: many(proposals),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  customer: one(customerProfiles, {
    fields: [events.customerId],
    references: [customerProfiles.id],
  }),
  proposals: many(proposals),
  bookings: many(bookings),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  provider: one(providerProfiles, {
    fields: [services.providerId],
    references: [providerProfiles.id],
  }),
  bookings: many(bookings),
}));

export const proposalsRelations = relations(proposals, ({ one }) => ({
  event: one(events, {
    fields: [proposals.eventId],
    references: [events.id],
  }),
  employee: one(employeeProfiles, {
    fields: [proposals.employeeId],
    references: [employeeProfiles.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  event: one(events, {
    fields: [bookings.eventId],
    references: [events.id],
  }),
  customer: one(customerProfiles, {
    fields: [bookings.customerId],
    references: [customerProfiles.id],
  }),
  provider: one(providerProfiles, {
    fields: [bookings.providerId],
    references: [providerProfiles.id],
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
}));

export const portfolioItemsRelations = relations(portfolioItems, ({ one }) => ({
  provider: one(providerProfiles, {
    fields: [portfolioItems.providerId],
    references: [providerProfiles.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  customer: one(customerProfiles, {
    fields: [reviews.customerId],
    references: [customerProfiles.id],
  }),
  provider: one(providerProfiles, {
    fields: [reviews.providerId],
    references: [providerProfiles.id],
  }),
  booking: one(bookings, {
    fields: [reviews.bookingId],
    references: [bookings.id],
  }),
}));

// Schemas for validation and type safety

// AuthUser schemas
export const insertAuthUserSchema = createInsertSchema(authUsers);
export const selectAuthUserSchema = createSelectSchema(authUsers);

// Profile schemas
export const insertAdminProfileSchema = createInsertSchema(adminProfiles);
export const selectAdminProfileSchema = createSelectSchema(adminProfiles);

export const insertEmployeeProfileSchema = createInsertSchema(employeeProfiles);
export const selectEmployeeProfileSchema = createSelectSchema(employeeProfiles);

export const insertCustomerProfileSchema = createInsertSchema(customerProfiles);
export const selectCustomerProfileSchema = createSelectSchema(customerProfiles);

export const insertProviderProfileSchema = createInsertSchema(providerProfiles);
export const selectProviderProfileSchema = createSelectSchema(providerProfiles);

// Event schemas
export const insertEventSchema = createInsertSchema(events);
export const selectEventSchema = createSelectSchema(events);

// Service schemas
export const insertServiceSchema = createInsertSchema(services);
export const selectServiceSchema = createSelectSchema(services);

// Proposal schemas
export const insertProposalSchema = createInsertSchema(proposals);
export const selectProposalSchema = createSelectSchema(proposals);

// Booking schemas
export const insertBookingSchema = createInsertSchema(bookings);
export const selectBookingSchema = createSelectSchema(bookings);

// Portfolio schemas
export const insertPortfolioItemSchema = createInsertSchema(portfolioItems);
export const selectPortfolioItemSchema = createSelectSchema(portfolioItems);

// Review schemas
export const insertReviewSchema = createInsertSchema(reviews);
export const selectReviewSchema = createSelectSchema(reviews);

// Activity schemas
export const insertActivitySchema = createInsertSchema(activities);
export const selectActivitySchema = createSelectSchema(activities);

// Extended Types
export type AuthUser = typeof authUsers.$inferSelect;
export type InsertAuthUser = typeof authUsers.$inferInsert;

export type AdminProfile = typeof adminProfiles.$inferSelect;
export type InsertAdminProfile = typeof adminProfiles.$inferInsert;

export type EmployeeProfile = typeof employeeProfiles.$inferSelect;
export type InsertEmployeeProfile = typeof employeeProfiles.$inferInsert;

export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type InsertCustomerProfile = typeof customerProfiles.$inferInsert;

export type ProviderProfile = typeof providerProfiles.$inferSelect;
export type InsertProviderProfile = typeof providerProfiles.$inferInsert;

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertPortfolioItem = typeof portfolioItems.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

// Union type for all profile types
export type Profile = AdminProfile | EmployeeProfile | CustomerProfile | ProviderProfile;