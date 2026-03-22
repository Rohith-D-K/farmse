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
import { retailerRoutes } from './routes/retailer';

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
await fastify.register(retailerRoutes);

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

// Start server
const start = async () => {
    try {
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
