import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index';
import { sessions, users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface AuthenticatedRequest extends FastifyRequest {
    user?: {
        id: string;
        email: string;
        name: string;
        role: 'farmer' | 'buyer' | 'admin' | 'retailer';
        isActive: boolean;
        phone: string;
        location: string;
        deliveryLocation: string | null;
        latitude: number | null;
        longitude: number | null;
    };
}

export async function authenticate(
    request: AuthenticatedRequest,
    reply: FastifyReply
): Promise<void> {
    const sessionToken = request.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
        reply.code(401).send({ error: 'Unauthorized' });
        return;
    }

    try {
        // Find session
        const [session] = await db
            .select()
            .from(sessions)
            .where(eq(sessions.id, sessionToken))
            .limit(1);

        if (!session) {
            reply.code(401).send({ error: 'Invalid session' });
            return;
        }

        // Check if session expired
        if (new Date(session.expiresAt) < new Date()) {
            // Delete expired session
            await db.delete(sessions).where(eq(sessions.id, sessionToken));
            reply.code(401).send({ error: 'Session expired' });
            return;
        }

        // Get user
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, session.userId))
            .limit(1);

        if (!user) {
            reply.code(401).send({ error: 'User not found' });
            return;
        }

        if (!user.isActive) {
            reply.code(403).send({ error: 'Your account is deactivated. Contact support.' });
            return;
        }

        // Attach user to request
        request.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            phone: user.phone,
            location: user.location,
            deliveryLocation: user.deliveryLocation,
            latitude: user.latitude,
            longitude: user.longitude
        };
    } catch (error) {
        reply.code(500).send({ error: 'Authentication failed' });
    }
}

// Role-based auth middleware
export async function allowAdminOnly(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user || request.user.role !== 'admin') {
        reply.code(403).send({ error: 'Access denied. Admin role required.' });
    }
}

export async function allowFarmerOnly(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user || request.user.role !== 'farmer') {
        reply.code(403).send({ error: 'Access denied. Farmer role required.' });
    }
}

export async function allowBuyerOnly(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user || (request.user.role !== 'buyer' && request.user.role !== 'retailer')) {
        reply.code(403).send({ error: 'Access denied. Buyer role required.' });
    }
}

// Compatibility aliases
export const requireFarmer = allowFarmerOnly;
export const requireAdmin = allowAdminOnly;
export const requireBuyer = allowBuyerOnly;
