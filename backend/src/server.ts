import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifySocketIO from 'fastify-socket.io';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth';
import { productRoutes } from './routes/products';
import { orderRoutes } from './routes/orders';
import { reviewRoutes } from './routes/reviews';
import { userRoutes } from './routes/users';
import { adminRoutes } from './routes/admin';
import { helpRoutes } from './routes/help';
import { locationRoutes } from './routes/location';
import { aiRoutes } from './routes/ai';
import { chatRoutes } from './routes/chats';
import { priceRoutes } from './routes/price';
import { harvestRoutes } from './routes/harvests';
import { communityRoutes } from './routes/community';
import { retailerProfileRoutes } from './routes/retailer_profile';
import { pool } from './db/index';

dotenv.config();

const fastify = Fastify({
    logger: true
});

// Register CORS
// In Docker: ALLOWED_ORIGIN=* (nginx is the public entry point)
// In dev: defaults to localhost Vite dev server
const allowedOrigin = process.env.ALLOWED_ORIGIN;
const corsOrigin = allowedOrigin === '*'
    ? true  // allow all origins
    : allowedOrigin
        ? allowedOrigin.split(',').map(o => o.trim())
        : [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:4173',
            'http://127.0.0.1:4173',
            'http://localhost:8080',
            'http://127.0.0.1:8080'
        ];

await fastify.register(cors, {
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
});

// Health check route
fastify.get('/health', async (request, reply) => {
    return { status: 'ok', message: 'Farmse API is running with PostgreSQL' };
});

// Register routes
await fastify.register(authRoutes);
await fastify.register(productRoutes);
await fastify.register(orderRoutes);
await fastify.register(reviewRoutes);
await fastify.register(userRoutes);
await fastify.register(adminRoutes);
await fastify.register(helpRoutes);
await fastify.register(locationRoutes);
await fastify.register(aiRoutes);
await fastify.register(chatRoutes);
await fastify.register(priceRoutes);
await fastify.register(harvestRoutes);
await fastify.register(communityRoutes);
await fastify.register(retailerProfileRoutes);


// Register Socket.IO
await fastify.register(fastifySocketIO, {
    cors: {
        origin: corsOrigin === true ? '*' : corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Socket.IO event handlers
fastify.ready().then(() => {
    (fastify as any).io.on('connection', (socket: any) => {
        console.log('Socket connected:', socket.id);

        socket.on('join_chat', (chatId: string) => {
            socket.join(chatId);
            console.log(`Socket ${socket.id} joined chat ${chatId}`);
        });

        socket.on('join_user_room', (userId: string) => {
            socket.join(userId);
            console.log(`Socket ${socket.id} joined user room ${userId}`);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected:', socket.id);
        });
    });
});

// Run startup migrations for new columns/tables
const runMigrations = async () => {
    const client = await pool.connect();
    try {
        // Create retailer_profiles table if not exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS retailer_profiles (
                id TEXT PRIMARY KEY,
                buyer_id TEXT NOT NULL REFERENCES users(id),
                business_name TEXT NOT NULL,
                business_type TEXT NOT NULL,
                license_number TEXT NOT NULL,
                gst_number TEXT,
                address TEXT NOT NULL,
                phone TEXT NOT NULL,
                verification_status TEXT NOT NULL DEFAULT 'pending',
                admin_notes TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        // Add new columns to preorders if they don't exist
        await client.query(`ALTER TABLE preorders ADD COLUMN IF NOT EXISTS is_bulk_retailer BOOLEAN NOT NULL DEFAULT false`);
        await client.query(`ALTER TABLE preorders ADD COLUMN IF NOT EXISTS retailer_profile_id TEXT`);
        await client.query(`ALTER TABLE preorders ADD COLUMN IF NOT EXISTS delivery_priority TEXT NOT NULL DEFAULT 'normal'`);
        await client.query(`ALTER TABLE preorders ADD COLUMN IF NOT EXISTS discount_percent DOUBLE PRECISION NOT NULL DEFAULT 0`);

        // Seed admin user if not exists
        const { rows: adminRows } = await client.query(`SELECT id FROM users WHERE email = 'admin123@gmail.com' LIMIT 1`);
        if (adminRows.length === 0) {
            const { hashPassword, generateId } = await import('./utils/auth');
            const adminId = generateId();
            const adminHash = await hashPassword('admin123');
            await client.query(
                `INSERT INTO users (id, email, password_hash, name, phone, location, role, is_active)
                 VALUES ($1, 'admin123@gmail.com', $2, 'Admin', '0000000000', 'HQ', 'admin', true)`,
                [adminId, adminHash]
            );
            console.log('✅ Admin user seeded: admin123@gmail.com');
        }

        console.log('✅ Migrations applied successfully');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        client.release();
    }
};

// Start server
const start = async () => {
    try {
        await runMigrations();
        const port = parseInt(process.env.PORT || '3000');
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`🚀 Server running on http://localhost:${port}`);
        console.log(`📊 Using PostgreSQL database`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
