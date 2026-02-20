import { FastifyInstance } from 'fastify';
import { db } from '../db/index';
import { users, sessions } from '../db/schema';
import { eq } from 'drizzle-orm';
import {
    generateId,
    hashPassword,
    verifyPassword,
    generateSessionToken,
    getSessionExpiry
} from '../utils/auth';

export async function authRoutes(fastify: FastifyInstance) {
    // Register
    fastify.post('/api/auth/register', async (request, reply) => {
        const { email, password, name, phone, location, role, deliveryLocation, latitude, longitude } = request.body as {
            email: string;
            password: string;
            name: string;
            phone: string;
            location: string;
            role: 'farmer' | 'buyer';
            deliveryLocation?: string;
            latitude?: number;
            longitude?: number;
        };

        try {
            if (!['buyer', 'farmer'].includes(role)) {
                return reply.code(403).send({ error: 'Invalid role for public registration' });
            }

            // Check if user exists
            const [existingUser] = await db
                .select()
                .from(users)
                .where(eq(users.email, email))
                .limit(1);

            if (existingUser) {
                return reply.code(400).send({ error: 'User already exists' });
            }

            // Create user
            const userId = generateId();
            const passwordHash = await hashPassword(password);
            const hasValidCoordinates =
                typeof latitude === 'number' &&
                typeof longitude === 'number' &&
                latitude >= -90 &&
                latitude <= 90 &&
                longitude >= -180 &&
                longitude <= 180;

            await db.insert(users).values({
                id: userId,
                email,
                passwordHash,
                name,
                phone,
                location,
                role,
                deliveryLocation: deliveryLocation || null,
                latitude: hasValidCoordinates ? latitude : null,
                longitude: hasValidCoordinates ? longitude : null
            });

            // Create session
            const sessionToken = generateSessionToken();
            await db.insert(sessions).values({
                id: sessionToken,
                userId,
                expiresAt: getSessionExpiry()
            });

            // Get user data
            const [user] = await db
                .select({
                    id: users.id,
                    email: users.email,
                    name: users.name,
                    phone: users.phone,
                    location: users.location,
                    role: users.role,
                    isActive: users.isActive,
                    deliveryLocation: users.deliveryLocation,
                    latitude: users.latitude,
                    longitude: users.longitude
                })
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);

            return reply.send({
                user,
                sessionToken
            });
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Login
    fastify.post('/api/auth/login', async (request, reply) => {
        const { email, password } = request.body as {
            email: string;
            password: string;
        };

        try {
            // Find user
            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.email, email))
                .limit(1);

            if (!user) {
                return reply.code(401).send({ error: 'Invalid credentials' });
            }

            if (!user.isActive) {
                return reply.code(403).send({ error: 'Your account is deactivated. Contact support.' });
            }

            // Verify password
            const isValid = await verifyPassword(password, user.passwordHash);
            if (!isValid) {
                return reply.code(401).send({ error: 'Invalid credentials' });
            }

            // Create session
            const sessionToken = generateSessionToken();
            await db.insert(sessions).values({
                id: sessionToken,
                userId: user.id,
                expiresAt: getSessionExpiry()
            });

            // Return user data (without password hash)
            const userData = {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                location: user.location,
                role: user.role,
                isActive: user.isActive,
                deliveryLocation: user.deliveryLocation,
                latitude: user.latitude,
                longitude: user.longitude
            };

            return reply.send({
                user: userData,
                sessionToken
            });
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Logout
    fastify.post('/api/auth/logout', async (request, reply) => {
        const sessionToken = request.headers.authorization?.replace('Bearer ', '');

        if (!sessionToken) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        try {
            await db.delete(sessions).where(eq(sessions.id, sessionToken));
            return reply.send({ message: 'Logged out successfully' });
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Get current user
    fastify.get('/api/auth/me', async (request, reply) => {
        const sessionToken = request.headers.authorization?.replace('Bearer ', '');

        if (!sessionToken) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        try {
            // Find session
            const [session] = await db
                .select()
                .from(sessions)
                .where(eq(sessions.id, sessionToken))
                .limit(1);

            if (!session) {
                return reply.code(401).send({ error: 'Invalid session' });
            }

            // Check expiry
            if (new Date(session.expiresAt) < new Date()) {
                await db.delete(sessions).where(eq(sessions.id, sessionToken));
                return reply.code(401).send({ error: 'Session expired' });
            }

            // Get user
            const [user] = await db
                .select({
                    id: users.id,
                    email: users.email,
                    name: users.name,
                    phone: users.phone,
                    location: users.location,
                    role: users.role,
                    isActive: users.isActive,
                    deliveryLocation: users.deliveryLocation,
                    latitude: users.latitude,
                    longitude: users.longitude
                })
                .from(users)
                .where(eq(users.id, session.userId))
                .limit(1);

            if (!user) {
                return reply.code(401).send({ error: 'User not found' });
            }

            return reply.send({ user });
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });
}
