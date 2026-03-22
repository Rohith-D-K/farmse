import { FastifyInstance } from 'fastify';
import { db } from '../db/index';
import { users, harvests, orders, helpReports } from '../db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { authenticate, AuthenticatedRequest, allowAdminOnly } from '../middleware/auth';

export async function adminRoutes(fastify: FastifyInstance) {
    // Get Platform Statistics
    fastify.get('/api/admin/stats', { preHandler: [authenticate, allowAdminOnly] }, async (request: AuthenticatedRequest, reply) => {
        try {
            const allUsers = await db.select().from(users);
            const allOrders = await db.select().from(orders);
            const allHarvests = await db.select().from(harvests);

            const stats = {
                totalUsers: allUsers.length,
                totalFarmers: allUsers.filter(u => u.role === 'farmer').length,
                totalBuyers: allUsers.filter(u => u.role === 'buyer').length,
                totalRetailers: allUsers.filter(u => u.role === 'retailer').length,
                totalOrders: allOrders.length,
                totalHarvests: allHarvests.length,
            };

            return reply.send(stats);
        } catch (error) {
            console.error('Error fetching admin stats:', error);
            return reply.code(500).send({ error: 'Failed to fetch platform statistics' });
        }
    });

    // List Pending Retailers
    fastify.get('/api/admin/retailers/pending', { preHandler: [authenticate, allowAdminOnly] }, async (request: AuthenticatedRequest, reply) => {
        try {
            const pendingRetailers = await db
                .select()
                .from(users)
                .where(and(eq(users.role, 'retailer'), eq(users.retailerStatus, 'pending')));
            
            return reply.send(pendingRetailers);
        } catch (error) {
            console.error('Error fetching pending retailers:', error);
            return reply.code(500).send({ error: 'Failed to fetch pending retailers' });
        }
    });

    // Verify Retailer (Approve/Reject)
    fastify.post('/api/admin/retailers/:id/verify', { preHandler: [authenticate, allowAdminOnly] }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };
        const { status } = request.body as { status: 'verified' | 'rejected' };

        if (!['verified', 'rejected'].includes(status)) {
            return reply.code(400).send({ error: 'Invalid status' });
        }

        try {
            const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
            if (!user || user.role !== 'retailer') {
                return reply.code(404).send({ error: 'Retailer not found' });
            }

            await db.update(users)
                .set({ retailerStatus: status })
                .where(eq(users.id, id));

            return reply.send({ message: `Retailer successfully ${status}` });
        } catch (error) {
            console.error('Error verifying retailer:', error);
            return reply.code(500).send({ error: 'Failed to verify retailer' });
        }
    });

    // View All Users
    fastify.get('/api/admin/users', { preHandler: [authenticate, allowAdminOnly] }, async (request: AuthenticatedRequest, reply) => {
        try {
            const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
            return reply.send(allUsers);
        } catch (error) {
            console.error('Error fetching all users:', error);
            return reply.code(500).send({ error: 'Failed to fetch users' });
        }
    });

    // View All Harvests
    fastify.get('/api/admin/harvests', { preHandler: [authenticate, allowAdminOnly] }, async (request: AuthenticatedRequest, reply) => {
        try {
            const allHarvests = await db.select().from(harvests).orderBy(desc(harvests.createdAt));
            return reply.send(allHarvests);
        } catch (error) {
            console.error('Error fetching all harvests:', error);
            return reply.code(500).send({ error: 'Failed to fetch harvests' });
        }
    });

    // View Reports / Complaints
    fastify.get('/api/admin/reports', { preHandler: [authenticate, allowAdminOnly] }, async (request: AuthenticatedRequest, reply) => {
        try {
            const reports = await db.select().from(helpReports).orderBy(desc(helpReports.createdAt));
            return reply.send(reports);
        } catch (error) {
            console.error('Error fetching reports:', error);
            return reply.code(500).send({ error: 'Failed to fetch reports' });
        }
    });

    // Deactivate User
    fastify.post('/api/admin/users/:id/deactivate', { preHandler: [authenticate, allowAdminOnly] }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };
        try {
            await db.update(users).set({ isActive: false }).where(eq(users.id, id));
            return reply.send({ message: 'User deactivated successfully' });
        } catch (error) {
            console.error('Error deactivating user:', error);
            return reply.code(500).send({ error: 'Failed to deactivate user' });
        }
    });
}
