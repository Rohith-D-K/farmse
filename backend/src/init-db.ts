import { db, pool } from './db/index';
import { users } from './db/schema';
import { sql } from 'drizzle-orm';
import { generateId, hashPassword } from './utils/auth';

async function initDatabase() {
  console.log('🔧 Initializing PostgreSQL database...\n');

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        location TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('farmer', 'buyer', 'admin', 'retailer')),
        is_active BOOLEAN NOT NULL DEFAULT true,
        delivery_location TEXT,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        retailer_status TEXT CHECK(retailer_status IN ('pending', 'verified', 'rejected')),
        business_name TEXT,
        business_type TEXT,
        license_number TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        farmer_id TEXT NOT NULL REFERENCES users(id),
        crop_name TEXT NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        quantity INTEGER NOT NULL,
        location TEXT NOT NULL,
        image TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products(id),
        farmer_id TEXT NOT NULL REFERENCES users(id),
        buyer_id TEXT NOT NULL REFERENCES users(id),
        quantity DOUBLE PRECISION NOT NULL,
        total_price DOUBLE PRECISION NOT NULL,
        delivery_method TEXT NOT NULL CHECK(delivery_method IN ('buyer_pickup', 'farmer_delivery', 'local_transport')),
        payment_method TEXT NOT NULL CHECK(payment_method IN ('upi', 'bank_transfer', 'cash_on_delivery')),
        payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'completed', 'failed')),
        order_status TEXT NOT NULL DEFAULT 'pending' CHECK(order_status IN ('pending', 'accepted', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'completed', 'rejected')),
        otp TEXT,
        delivery_date TEXT,
        order_type TEXT NOT NULL DEFAULT 'normal',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES orders(id),
        product_id TEXT NOT NULL REFERENCES products(id),
        buyer_id TEXT NOT NULL REFERENCES users(id),
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS help_reports (
        id TEXT PRIMARY KEY,
        reporter_id TEXT NOT NULL REFERENCES users(id),
        reported_user_id TEXT REFERENCES users(id),
        order_id TEXT REFERENCES orders(id),
        category TEXT NOT NULL CHECK(category IN ('scam', 'payment_issue', 'delivery_issue', 'other')),
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'resolved')),
        admin_notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        resolved_at TEXT
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products(id),
        buyer_id TEXT NOT NULL REFERENCES users(id),
        farmer_id TEXT NOT NULL REFERENCES users(id),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL REFERENCES chats(id),
        sender_id TEXT NOT NULL REFERENCES users(id),
        text TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS market_prices (
        id TEXT PRIMARY KEY,
        crop_name TEXT NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        source TEXT NOT NULL DEFAULT 'default',
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS crop_searches (
        id TEXT PRIMARY KEY,
        crop_name TEXT NOT NULL,
        searched_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS harvests (
        id TEXT PRIMARY KEY,
        farmer_id TEXT NOT NULL REFERENCES users(id),
        crop_name TEXT NOT NULL,
        expected_harvest_date TEXT NOT NULL,
        estimated_quantity INTEGER NOT NULL,
        base_price_per_kg DOUBLE PRECISION NOT NULL,
        min_preorder_quantity INTEGER NOT NULL,
        preorder_deadline TEXT NOT NULL,
        location TEXT NOT NULL,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        description TEXT,
        image TEXT,
        status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed', 'completed', 'cancelled')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS preorders (
        id TEXT PRIMARY KEY,
        harvest_id TEXT NOT NULL REFERENCES harvests(id),
        buyer_id TEXT NOT NULL REFERENCES users(id),
        quantity INTEGER NOT NULL,
        delivery_method TEXT NOT NULL CHECK(delivery_method IN ('buyer_pickup', 'farmer_delivery', 'local_transport')),
        status TEXT NOT NULL DEFAULT 'reserved' CHECK(status IN ('reserved', 'confirmed', 'delivered', 'cancelled')),
        is_bulk BOOLEAN NOT NULL DEFAULT false,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS negotiations (
        id TEXT PRIMARY KEY,
        harvest_id TEXT NOT NULL REFERENCES harvests(id),
        retailer_id TEXT NOT NULL REFERENCES users(id),
        farmer_id TEXT NOT NULL REFERENCES users(id),
        offer_price DOUBLE PRECISION NOT NULL,
        quantity INTEGER NOT NULL,
        message TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'counter_offer')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        farmer_id TEXT NOT NULL REFERENCES users(id),
        retailer_id TEXT NOT NULL REFERENCES users(id),
        crop_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly')),
        duration INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'cancelled')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed default market prices for common Indian crops (₹ per kg)
    const defaultMarketPrices = [
      { crop: 'Rice', price: 38 },
      { crop: 'Wheat', price: 28 },
      { crop: 'Tomato', price: 35 },
      { crop: 'Onion', price: 30 },
      { crop: 'Potato', price: 22 },
      { crop: 'Carrot', price: 40 },
      { crop: 'Spinach', price: 25 },
      { crop: 'Brinjal', price: 32 },
      { crop: 'Cauliflower', price: 35 },
      { crop: 'Cabbage', price: 20 },
      { crop: 'Banana', price: 45 },
      { crop: 'Mango', price: 80 },
    ];

    for (const mp of defaultMarketPrices) {
      const existing = await db.execute(
        sql`SELECT id FROM market_prices WHERE LOWER(crop_name) = LOWER(${mp.crop}) LIMIT 1`
      );
      if (existing.rows.length === 0) {
        await db.execute(
          sql`INSERT INTO market_prices (id, crop_name, price, source) VALUES (${generateId()}, ${mp.crop}, ${mp.price}, 'government_default')`
        );
      }
    }
    console.log('💰 Market prices seeded for', defaultMarketPrices.length, 'crops');

    const existingAdmin = await db.execute(
      sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`
    );

    if (existingAdmin.rows.length === 0) {
      const adminPasswordHash = await hashPassword('admin123');
      await db.insert(users).values({
        id: generateId(),
        email: 'admin@farmse.local',
        passwordHash: adminPasswordHash,
        name: 'FarmSe Admin',
        phone: '+91 90000 00000',
        location: 'HQ',
        role: 'admin',
        isActive: true,
        deliveryLocation: null,
        latitude: null,
        longitude: null
      });

      console.log('🛡️ Default admin created: admin@farmse.local / admin123');
    }

    // Attempt to alter harvests table for existing DBs
    try {
        await db.execute(sql`ALTER TABLE harvests ADD COLUMN IF NOT EXISTS image TEXT`);
        await db.execute(sql`ALTER TABLE harvests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open'`);
        
        // Upgrade existing DBs for new order attributes
        await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS otp TEXT`);
        await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date TEXT`);
        await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'normal'`);
        
        // Note: Changing constraints or data types on existing columns (like order_status enum) 
        // in PostgreSQL via simple ALTER often requires dropping and re-adding constraints.
        // For local development with raw SQL init, we'll try to just update the column types if needed,
        // but adding columns is the most critical part for the immediate crash.
    } catch (e) {
        // Ignore if error
    }

    console.log('✅ Database tables created successfully!\n');
    console.log('📊 Tables created:');
    console.log('  - users');
    console.log('  - products');
    console.log('  - orders');
    console.log('  - reviews');
    console.log('  - sessions');
    console.log('  - help_reports');
    console.log('  - chats');
    console.log('  - messages\n');

  } catch (error: any) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();
