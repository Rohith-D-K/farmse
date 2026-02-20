import { FastifyInstance } from 'fastify';
import { db } from '../db/index';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

export async function userRoutes(fastify: FastifyInstance) {
    // Get current user's profile
    fastify.get('/api/users/profile', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        try {
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
                    longitude: users.longitude,
                    createdAt: users.createdAt
                })
                .from(users)
                .where(eq(users.id, request.user!.id))
                .limit(1);

            if (!user) {
                return reply.code(404).send({ error: 'User not found' });
            }

            return reply.send(user);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Update user profile
    fastify.put('/api/users/profile', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { name, phone, location, deliveryLocation, latitude, longitude } = request.body as {
            name?: string;
            phone?: string;
            location?: string;
            deliveryLocation?: string;
            latitude?: number;
            longitude?: number;
        };

        try {
            // Validate required fields
            if (!name || !phone || !location) {
                return reply.code(400).send({
                    error: 'Name, phone, and location are required'
                });
            }

            // Validate phone format (basic validation)
            if (!/^\+?\d{10,15}$/.test(phone.replace(/\s/g, ''))) {
                return reply.code(400).send({
                    error: 'Invalid phone number format'
                });
            }

            // Update user profile
            const updateData: any = {
                name,
                phone,
                location
            };

            if (latitude !== undefined || longitude !== undefined) {
                if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
                    return reply.code(400).send({ error: 'Latitude must be between -90 and 90' });
                }
                if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
                    return reply.code(400).send({ error: 'Longitude must be between -180 and 180' });
                }

                updateData.latitude = latitude;
                updateData.longitude = longitude;
            }

            // Only update deliveryLocation if user is a buyer
            if (request.user!.role === 'buyer') {
                updateData.deliveryLocation = deliveryLocation || null;
            }

            await db
                .update(users)
                .set(updateData)
                .where(eq(users.id, request.user!.id));

            // Fetch updated user
            const [updatedUser] = await db
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
                    longitude: users.longitude,
                    createdAt: users.createdAt
                })
                .from(users)
                .where(eq(users.id, request.user!.id))
                .limit(1);

            return reply.send(updatedUser);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Update user GPS coordinates (automatic location sync)
    fastify.put('/api/users/location', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { latitude, longitude } = request.body as {
            latitude: number;
            longitude: number;
        };

        try {
            if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
                return reply.code(400).send({ error: 'Latitude must be between -90 and 90' });
            }

            if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
                return reply.code(400).send({ error: 'Longitude must be between -180 and 180' });
            }

            await db
                .update(users)
                .set({ latitude, longitude })
                .where(eq(users.id, request.user!.id));

            return reply.send({ message: 'Location updated successfully', latitude, longitude });
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });
}
