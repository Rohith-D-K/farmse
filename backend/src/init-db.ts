import { db } from './db/index';
import { users, products, orders, reviews, sessions } from './db/schema';
import { sql } from 'drizzle-orm';
import { generateId, hashPassword } from './utils/auth';

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
        role TEXT CHECK(role IN ('farmer', 'buyer', 'admin')) NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        delivery_location TEXT,
        latitude REAL,
        longitude REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Backward-compatible migration for existing databases
    const existingUserColumns = await db.all<{ name: string }>(sql`PRAGMA table_info(users)`);
    const userColumnNames = new Set(existingUserColumns.map(column => column.name));

    if (!userColumnNames.has('latitude')) {
      await db.run(sql`ALTER TABLE users ADD COLUMN latitude REAL`);
    }

    if (!userColumnNames.has('longitude')) {
      await db.run(sql`ALTER TABLE users ADD COLUMN longitude REAL`);
    }

    if (!userColumnNames.has('is_active')) {
      await db.run(sql`ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`);
    }

    const existingUserTableDefinition = await db.get<{ sql: string | null }>(
      sql`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users' LIMIT 1`
    );

    const usersTableNeedsRoleMigration =
      existingUserTableDefinition?.sql &&
      !existingUserTableDefinition.sql.includes("'admin'");

    if (usersTableNeedsRoleMigration) {
      await db.run(sql`PRAGMA foreign_keys = OFF`);
      await db.run(sql`BEGIN TRANSACTION`);

      try {
        await db.run(sql`ALTER TABLE users RENAME TO users_old`);

        await db.run(sql`
          CREATE TABLE users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            location TEXT NOT NULL,
            role TEXT CHECK(role IN ('farmer', 'buyer', 'admin')) NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            delivery_location TEXT,
            latitude REAL,
            longitude REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await db.run(sql`
          INSERT INTO users (
            id,
            email,
            password_hash,
            name,
            phone,
            location,
            role,
            is_active,
            delivery_location,
            latitude,
            longitude,
            created_at
          )
          SELECT
            id,
            email,
            password_hash,
            name,
            phone,
            location,
            role,
            COALESCE(is_active, 1),
            delivery_location,
            latitude,
            longitude,
            created_at
          FROM users_old
        `);

        await db.run(sql`DROP TABLE users_old`);
        await db.run(sql`COMMIT`);
      } catch (error) {
        await db.run(sql`ROLLBACK`);
        throw error;
      } finally {
        await db.run(sql`PRAGMA foreign_keys = ON`);
      }
    }

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
        payment_method TEXT CHECK(payment_method IN ('upi', 'bank_transfer', 'cash_on_delivery')) NOT NULL,
        payment_status TEXT CHECK(payment_status IN ('pending', 'completed')) NOT NULL DEFAULT 'completed',
        order_status TEXT CHECK(order_status IN ('pending', 'accepted', 'delivered', 'completed', 'rejected')) NOT NULL DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (farmer_id) REFERENCES users(id),
        FOREIGN KEY (buyer_id) REFERENCES users(id)
      )
    `);

    const existingOrderTableDefinition = await db.get<{ sql: string | null }>(
      sql`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'orders' LIMIT 1`
    );

    const ordersTableNeedsPaymentMethodMigration =
      existingOrderTableDefinition?.sql &&
      !existingOrderTableDefinition.sql.includes('cash_on_delivery');

    if (ordersTableNeedsPaymentMethodMigration) {
      await db.run(sql`PRAGMA foreign_keys = OFF`);
      await db.run(sql`BEGIN TRANSACTION`);

      try {
        await db.run(sql`ALTER TABLE orders RENAME TO orders_old`);

        await db.run(sql`
          CREATE TABLE orders (
            id TEXT PRIMARY KEY,
            product_id TEXT NOT NULL,
            farmer_id TEXT NOT NULL,
            buyer_id TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            total_price REAL NOT NULL,
            delivery_method TEXT CHECK(delivery_method IN ('buyer_pickup', 'farmer_delivery', 'local_transport')) NOT NULL,
            payment_method TEXT CHECK(payment_method IN ('upi', 'bank_transfer', 'cash_on_delivery')) NOT NULL,
            payment_status TEXT CHECK(payment_status IN ('pending', 'completed')) NOT NULL DEFAULT 'completed',
            order_status TEXT CHECK(order_status IN ('pending', 'accepted', 'delivered', 'completed', 'rejected')) NOT NULL DEFAULT 'pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id),
            FOREIGN KEY (farmer_id) REFERENCES users(id),
            FOREIGN KEY (buyer_id) REFERENCES users(id)
          )
        `);

        await db.run(sql`
          INSERT INTO orders (
            id,
            product_id,
            farmer_id,
            buyer_id,
            quantity,
            total_price,
            delivery_method,
            payment_method,
            payment_status,
            order_status,
            created_at
          )
          SELECT
            id,
            product_id,
            farmer_id,
            buyer_id,
            quantity,
            total_price,
            delivery_method,
            payment_method,
            payment_status,
            order_status,
            created_at
          FROM orders_old
        `);

        await db.run(sql`DROP TABLE orders_old`);
        await db.run(sql`COMMIT`);
      } catch (error) {
        await db.run(sql`ROLLBACK`);
        throw error;
      } finally {
        await db.run(sql`PRAGMA foreign_keys = ON`);
      }
    }

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

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS help_reports (
        id TEXT PRIMARY KEY,
        reporter_id TEXT NOT NULL,
        reported_user_id TEXT,
        order_id TEXT,
        category TEXT CHECK(category IN ('scam', 'payment_issue', 'delivery_issue', 'other')) NOT NULL,
        description TEXT NOT NULL,
        status TEXT CHECK(status IN ('open', 'resolved')) NOT NULL DEFAULT 'open',
        admin_notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        resolved_at TEXT,
        FOREIGN KEY (reporter_id) REFERENCES users(id),
        FOREIGN KEY (reported_user_id) REFERENCES users(id),
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `);

    const tableReferencesUsersOld = async (tableName: string) => {
      const tableDef = await db.get<{ sql: string | null }>(
        sql`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ${tableName} LIMIT 1`
      );

      return Boolean(tableDef?.sql?.includes('users_old'));
    };

    const usersOldReferenceChecks = await Promise.all([
      tableReferencesUsersOld('products'),
      tableReferencesUsersOld('orders'),
      tableReferencesUsersOld('reviews'),
      tableReferencesUsersOld('sessions'),
      tableReferencesUsersOld('help_reports')
    ]);

    const needsUsersReferenceRepair = usersOldReferenceChecks.some(Boolean);

    if (needsUsersReferenceRepair) {
      await db.run(sql`PRAGMA foreign_keys = OFF`);
      await db.run(sql`BEGIN TRANSACTION`);

      try {
        if (await tableReferencesUsersOld('products')) {
          await db.run(sql`ALTER TABLE products RENAME TO products_ref_fix_old`);
          await db.run(sql`
            CREATE TABLE products (
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
            INSERT INTO products (id, farmer_id, crop_name, price, quantity, location, image, created_at)
            SELECT id, farmer_id, crop_name, price, quantity, location, image, created_at
            FROM products_ref_fix_old
          `);
          await db.run(sql`DROP TABLE products_ref_fix_old`);
        }

        if (await tableReferencesUsersOld('orders')) {
          await db.run(sql`ALTER TABLE orders RENAME TO orders_ref_fix_old`);
          await db.run(sql`
            CREATE TABLE orders (
              id TEXT PRIMARY KEY,
              product_id TEXT NOT NULL,
              farmer_id TEXT NOT NULL,
              buyer_id TEXT NOT NULL,
              quantity INTEGER NOT NULL,
              total_price REAL NOT NULL,
              delivery_method TEXT CHECK(delivery_method IN ('buyer_pickup', 'farmer_delivery', 'local_transport')) NOT NULL,
              payment_method TEXT CHECK(payment_method IN ('upi', 'bank_transfer', 'cash_on_delivery')) NOT NULL,
              payment_status TEXT CHECK(payment_status IN ('pending', 'completed')) NOT NULL DEFAULT 'completed',
              order_status TEXT CHECK(order_status IN ('pending', 'accepted', 'delivered', 'completed', 'rejected')) NOT NULL DEFAULT 'pending',
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (product_id) REFERENCES products(id),
              FOREIGN KEY (farmer_id) REFERENCES users(id),
              FOREIGN KEY (buyer_id) REFERENCES users(id)
            )
          `);
          await db.run(sql`
            INSERT INTO orders (
              id, product_id, farmer_id, buyer_id, quantity, total_price,
              delivery_method, payment_method, payment_status, order_status, created_at
            )
            SELECT
              id, product_id, farmer_id, buyer_id, quantity, total_price,
              delivery_method, payment_method, payment_status, order_status, created_at
            FROM orders_ref_fix_old
          `);
          await db.run(sql`DROP TABLE orders_ref_fix_old`);
        }

        if (await tableReferencesUsersOld('reviews')) {
          await db.run(sql`ALTER TABLE reviews RENAME TO reviews_ref_fix_old`);
          await db.run(sql`
            CREATE TABLE reviews (
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
            INSERT INTO reviews (id, order_id, product_id, buyer_id, rating, comment, created_at)
            SELECT id, order_id, product_id, buyer_id, rating, comment, created_at
            FROM reviews_ref_fix_old
          `);
          await db.run(sql`DROP TABLE reviews_ref_fix_old`);
        }

        if (await tableReferencesUsersOld('sessions')) {
          await db.run(sql`ALTER TABLE sessions RENAME TO sessions_ref_fix_old`);
          await db.run(sql`
            CREATE TABLE sessions (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              expires_at TEXT NOT NULL,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id)
            )
          `);
          await db.run(sql`
            INSERT INTO sessions (id, user_id, expires_at, created_at)
            SELECT id, user_id, expires_at, created_at
            FROM sessions_ref_fix_old
          `);
          await db.run(sql`DROP TABLE sessions_ref_fix_old`);
        }

        if (await tableReferencesUsersOld('help_reports')) {
          await db.run(sql`ALTER TABLE help_reports RENAME TO help_reports_ref_fix_old`);
          await db.run(sql`
            CREATE TABLE help_reports (
              id TEXT PRIMARY KEY,
              reporter_id TEXT NOT NULL,
              reported_user_id TEXT,
              order_id TEXT,
              category TEXT CHECK(category IN ('scam', 'payment_issue', 'delivery_issue', 'other')) NOT NULL,
              description TEXT NOT NULL,
              status TEXT CHECK(status IN ('open', 'resolved')) NOT NULL DEFAULT 'open',
              admin_notes TEXT,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              resolved_at TEXT,
              FOREIGN KEY (reporter_id) REFERENCES users(id),
              FOREIGN KEY (reported_user_id) REFERENCES users(id),
              FOREIGN KEY (order_id) REFERENCES orders(id)
            )
          `);
          await db.run(sql`
            INSERT INTO help_reports (
              id, reporter_id, reported_user_id, order_id,
              category, description, status, admin_notes, created_at, resolved_at
            )
            SELECT
              id, reporter_id, reported_user_id, order_id,
              category, description, status, admin_notes, created_at, resolved_at
            FROM help_reports_ref_fix_old
          `);
          await db.run(sql`DROP TABLE help_reports_ref_fix_old`);
        }

        await db.run(sql`COMMIT`);
      } catch (error) {
        await db.run(sql`ROLLBACK`);
        throw error;
      } finally {
        await db.run(sql`PRAGMA foreign_keys = ON`);
      }
    }

    const existingAdmin = await db.get<{ id: string }>(
      sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`
    );

    if (!existingAdmin) {
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
    console.log('  - sessions\n');
    console.log('  - help_reports\n');

  } catch (error: any) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

// Run initialization
initDatabase();
