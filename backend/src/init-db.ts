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
        role TEXT NOT NULL CHECK(role IN ('farmer', 'buyer', 'admin')),
        is_active BOOLEAN NOT NULL DEFAULT true,
        delivery_location TEXT,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
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
        quantity INTEGER NOT NULL,
        total_price DOUBLE PRECISION NOT NULL,
        delivery_method TEXT NOT NULL CHECK(delivery_method IN ('buyer_pickup', 'farmer_delivery', 'local_transport')),
        payment_method TEXT NOT NULL CHECK(payment_method IN ('upi', 'bank_transfer', 'cash_on_delivery')),
        payment_status TEXT NOT NULL DEFAULT 'completed' CHECK(payment_status IN ('pending', 'completed')),
        order_status TEXT NOT NULL DEFAULT 'pending' CHECK(order_status IN ('pending', 'accepted', 'delivered', 'completed', 'rejected')),
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
