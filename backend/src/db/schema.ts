import { pgTable, text, integer, doublePrecision, boolean, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    location: text('location').notNull(),
    role: text('role', { enum: ['farmer', 'buyer', 'admin', 'retailer'] }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    deliveryLocation: text('delivery_location'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Products table
export const products = pgTable('products', {
    id: text('id').primaryKey(),
    farmerId: text('farmer_id').notNull().references(() => users.id),
    cropName: text('crop_name').notNull(),
    price: doublePrecision('price').notNull(),
    quantity: doublePrecision('quantity').notNull(),
    location: text('location').notNull(),
    image: text('image').notNull(),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Orders table
export const orders = pgTable('orders', {
    id: text('id').primaryKey(),
    productId: text('product_id').references(() => products.id),
    harvestId: text('harvest_id').references(() => harvests.id),
    farmerId: text('farmer_id').notNull().references(() => users.id),
    buyerId: text('buyer_id').notNull().references(() => users.id),
    quantity: doublePrecision('quantity').notNull(),
    totalPrice: doublePrecision('total_price').notNull(),
    deliveryMethod: text('delivery_method', {
        enum: ['buyer_pickup', 'farmer_delivery', 'local_transport']
    }).notNull(),
    paymentMethod: text('payment_method', {
        enum: ['upi', 'bank_transfer', 'cash_on_delivery']
    }).notNull(),
    paymentStatus: text('payment_status', {
        enum: ['pending', 'completed', 'failed']
    }).notNull().default('pending'),
    orderStatus: text('order_status', {
        enum: ['pending', 'accepted', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'completed', 'rejected']
    }).notNull().default('pending'),
    otp: text('otp'),
    deliveryDate: text('delivery_date'),
    orderType: text('order_type').notNull().default('normal'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Reviews table
export const reviews = pgTable('reviews', {
    id: text('id').primaryKey(),
    orderId: text('order_id').notNull().references(() => orders.id),
    productId: text('product_id').references(() => products.id),
    harvestId: text('harvest_id').references(() => harvests.id),
    buyerId: text('buyer_id').notNull().references(() => users.id),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Sessions table for authentication
export const sessions = pgTable('sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    expiresAt: text('expires_at').notNull(),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Help reports table (buyer support / scam reports)
export const helpReports = pgTable('help_reports', {
    id: text('id').primaryKey(),
    reporterId: text('reporter_id').notNull().references(() => users.id),
    reportedUserId: text('reported_user_id').references(() => users.id),
    orderId: text('order_id').references(() => orders.id),
    category: text('category', {
        enum: ['scam', 'payment_issue', 'delivery_issue', 'other']
    }).notNull(),
    description: text('description').notNull(),
    status: text('status', { enum: ['open', 'resolved'] }).notNull().default('open'),
    adminNotes: text('admin_notes'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    resolvedAt: text('resolved_at')
});

// Chats table (link buyer, farmer, and product)
export const chats = pgTable('chats', {
    id: text('id').primaryKey(),
    productId: text('product_id').notNull().references(() => products.id),
    buyerId: text('buyer_id').notNull().references(() => users.id),
    farmerId: text('farmer_id').notNull().references(() => users.id),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Messages table
export const messages = pgTable('messages', {
    id: text('id').primaryKey(),
    chatId: text('chat_id').notNull().references(() => chats.id),
    senderId: text('sender_id').notNull().references(() => users.id),
    text: text('text').notNull(),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Market prices table (government/market reference prices)
export const marketPrices = pgTable('market_prices', {
    id: text('id').primaryKey(),
    cropName: text('crop_name').notNull(),
    price: doublePrecision('price').notNull(),
    source: text('source').notNull().default('default'),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Crop searches table (tracks buyer search activity for demand)
export const cropSearches = pgTable('crop_searches', {
    id: text('id').primaryKey(),
    cropName: text('crop_name').notNull(),
    searchedAt: text('searched_at').default(sql`CURRENT_TIMESTAMP`)
});

// Harvests table
export const harvests = pgTable('harvests', {
    id: text('id').primaryKey(),
    farmerId: text('farmer_id').notNull().references(() => users.id),
    cropName: text('crop_name').notNull(),
    expectedHarvestDate: text('expected_harvest_date').notNull(),
    estimatedQuantity: doublePrecision('estimated_quantity').notNull(), // in kg
    basePricePerKg: doublePrecision('base_price_per_kg').notNull(),
    minPreorderQuantity: doublePrecision('min_preorder_quantity').notNull(),
    preorderDeadline: text('preorder_deadline').notNull(),
    location: text('location').notNull(),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    description: text('description'),
    image: text('image'),
    status: text('status', { enum: ['open', 'closed', 'completed', 'cancelled'] }).notNull().default('open'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Preorders table
export const preorders = pgTable('preorders', {
    id: text('id').primaryKey(),
    harvestId: text('harvest_id').notNull().references(() => harvests.id),
    buyerId: text('buyer_id').notNull().references(() => users.id),
    quantity: doublePrecision('quantity').notNull(), // in kg
    deliveryMethod: text('delivery_method', {
        enum: ['buyer_pickup', 'farmer_delivery', 'local_transport']
    }).notNull(),
    status: text('status', {
        enum: ['reserved', 'confirmed', 'delivered', 'cancelled']
    }).notNull().default('reserved'),
    isBulk: boolean('is_bulk').notNull().default(false),
    isBulkRetailer: boolean('is_bulk_retailer').notNull().default(false),
    retailerProfileId: text('retailer_profile_id'),
    deliveryPriority: text('delivery_priority', { enum: ['normal', 'high'] }).notNull().default('normal'),
    discountPercent: doublePrecision('discount_percent').notNull().default(0),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Retailer profiles table (for buyers who want bulk/retailer privileges)
export const retailerProfiles = pgTable('retailer_profiles', {
    id: text('id').primaryKey(),
    buyerId: text('buyer_id').notNull().references(() => users.id),
    businessName: text('business_name').notNull(),
    businessType: text('business_type', {
        enum: ['grocery', 'wholesale', 'restaurant', 'other']
    }).notNull(),
    licenseNumber: text('license_number').notNull(),
    gstNumber: text('gst_number'),
    address: text('address').notNull(),
    phone: text('phone').notNull(),
    verificationStatus: text('verification_status', {
        enum: ['pending', 'verified', 'rejected']
    }).notNull().default('pending'),
    adminNotes: text('admin_notes'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type HelpReport = typeof helpReports.$inferSelect;
export type NewHelpReport = typeof helpReports.$inferInsert;
export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type MarketPrice = typeof marketPrices.$inferSelect;
export type NewMarketPrice = typeof marketPrices.$inferInsert;
export type CropSearch = typeof cropSearches.$inferSelect;
export type NewCropSearch = typeof cropSearches.$inferInsert;
export type Harvest = typeof harvests.$inferSelect;
export type NewHarvest = typeof harvests.$inferInsert;
export type Preorder = typeof preorders.$inferSelect;
export type NewPreorder = typeof preorders.$inferInsert;
export type RetailerProfile = typeof retailerProfiles.$inferSelect;
export type NewRetailerProfile = typeof retailerProfiles.$inferInsert;
