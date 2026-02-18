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
                    deliveryLocation: users.deliveryLocation,
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
        const { name, phone, location, deliveryLocation } = request.body as {
            name?: string;
            phone?: string;
            location?: string;
            deliveryLocation?: string;
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
                    deliveryLocation: users.deliveryLocation,
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
}
