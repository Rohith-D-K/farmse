import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth';
import { productRoutes } from './routes/products';
import { orderRoutes } from './routes/orders';
import { reviewRoutes } from './routes/reviews';
import { userRoutes } from './routes/users';

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
    credentials: true
});

// Health check route
fastify.get('/health', async (request, reply) => {
    return { status: 'ok', message: 'Farmse API is running with SQLite' };
});

// Register routes
await fastify.register(authRoutes);
await fastify.register(productRoutes);
await fastify.register(orderRoutes);
await fastify.register(reviewRoutes);
await fastify.register(userRoutes);

// Start server
const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3000');
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`🚀 Server running on http://localhost:${port}`);
        console.log(`📊 Using SQLite database`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
