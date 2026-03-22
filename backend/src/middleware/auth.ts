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
        retailerStatus: string | null;
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
            longitude: user.longitude,
            retailerStatus: user.retailerStatus || null
        };
    } catch (error) {
        reply.code(500).send({ error: 'Authentication failed' });
    }
}

// Role-based auth middleware
export async function requireFarmer(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user || request.user.role !== 'farmer') {
        reply.code(403).send({ error: 'Only farmers can perform this action' });
        // NOTE: we don't throw, Fastify intercepts the reply code
    }
}

export async function requireRetailer(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user || request.user.role !== 'retailer') {
        reply.code(403).send({ error: 'Only retailers can perform this action' });
    } else if (request.user.retailerStatus !== 'verified') {
        reply.code(403).send({ error: 'Your retailer account is currently pending verification. Admin approval is required.' });
    }
}

export async function requireBuyerOrRetailer(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user || (request.user.role !== 'buyer' && request.user.role !== 'retailer')) {
        reply.code(403).send({ error: 'Only buyers and retailers can perform this action' });
    }
}

