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
    role: text('role', { enum: ['farmer', 'buyer', 'admin'] }).notNull(),
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
    quantity: integer('quantity').notNull(),
    location: text('location').notNull(),
    image: text('image').notNull(),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Orders table
export const orders = pgTable('orders', {
    id: text('id').primaryKey(),
    productId: text('product_id').notNull().references(() => products.id),
    farmerId: text('farmer_id').notNull().references(() => users.id),
    buyerId: text('buyer_id').notNull().references(() => users.id),
    quantity: integer('quantity').notNull(),
    totalPrice: doublePrecision('total_price').notNull(),
    deliveryMethod: text('delivery_method', {
        enum: ['buyer_pickup', 'farmer_delivery', 'local_transport']
    }).notNull(),
    paymentMethod: text('payment_method', {
        enum: ['upi', 'bank_transfer', 'cash_on_delivery']
    }).notNull(),
    paymentStatus: text('payment_status', {
        enum: ['pending', 'completed']
    }).notNull().default('completed'),
    orderStatus: text('order_status', {
        enum: ['pending', 'accepted', 'delivered', 'completed', 'rejected']
    }).notNull().default('pending'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Reviews table
export const reviews = pgTable('reviews', {
    id: text('id').primaryKey(),
    orderId: text('order_id').notNull().references(() => orders.id),
    productId: text('product_id').notNull().references(() => products.id),
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
