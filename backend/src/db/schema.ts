import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    location: text('location').notNull(),
    role: text('role', { enum: ['farmer', 'buyer'] }).notNull(),
    deliveryLocation: text('delivery_location'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Products table
export const products = sqliteTable('products', {
    id: text('id').primaryKey(),
    farmerId: text('farmer_id').notNull().references(() => users.id),
    cropName: text('crop_name').notNull(),
    price: real('price').notNull(),
    quantity: integer('quantity').notNull(),
    location: text('location').notNull(),
    image: text('image').notNull(),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Orders table
export const orders = sqliteTable('orders', {
    id: text('id').primaryKey(),
    productId: text('product_id').notNull().references(() => products.id),
    farmerId: text('farmer_id').notNull().references(() => users.id),
    buyerId: text('buyer_id').notNull().references(() => users.id),
    quantity: integer('quantity').notNull(),
    totalPrice: real('total_price').notNull(),
    deliveryMethod: text('delivery_method', {
        enum: ['buyer_pickup', 'farmer_delivery', 'local_transport']
    }).notNull(),
    paymentMethod: text('payment_method', {
        enum: ['upi', 'bank_transfer']
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
export const reviews = sqliteTable('reviews', {
    id: text('id').primaryKey(),
    orderId: text('order_id').notNull().references(() => orders.id),
    productId: text('product_id').notNull().references(() => products.id),
    buyerId: text('buyer_id').notNull().references(() => users.id),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Sessions table for authentication
export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    expiresAt: text('expires_at').notNull(),
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
