import { db } from './db/index';
import { users, products, orders, reviews, sessions } from './db/schema';
import { sql } from 'drizzle-orm';

async function initDatabase() {
  console.log('🔧 Initializing SQLite database...\n');

  try {
    // Create tables using raw SQL (Drizzle will handle schema)
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        location TEXT NOT NULL,
        role TEXT CHECK(role IN ('farmer', 'buyer')) NOT NULL,
        delivery_location TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        farmer_id TEXT NOT NULL,
        crop_name TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        location TEXT NOT NULL,
        image TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farmer_id) REFERENCES users(id)
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        farmer_id TEXT NOT NULL,
        buyer_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        total_price REAL NOT NULL,
        delivery_method TEXT CHECK(delivery_method IN ('buyer_pickup', 'farmer_delivery', 'local_transport')) NOT NULL,
        payment_method TEXT CHECK(payment_method IN ('upi', 'bank_transfer')) NOT NULL,
        payment_status TEXT CHECK(payment_status IN ('pending', 'completed')) NOT NULL DEFAULT 'completed',
        order_status TEXT CHECK(order_status IN ('pending', 'accepted', 'delivered', 'completed', 'rejected')) NOT NULL DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (farmer_id) REFERENCES users(id),
        FOREIGN KEY (buyer_id) REFERENCES users(id)
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        buyer_id TEXT NOT NULL,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5) NOT NULL,
        comment TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (buyer_id) REFERENCES users(id)
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log('✅ Database tables created successfully!\n');
    console.log('📊 Tables created:');
    console.log('  - users');
    console.log('  - products');
    console.log('  - orders');
    console.log('  - reviews');
    console.log('  - sessions\n');

  } catch (error: any) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

// Run initialization
initDatabase();
