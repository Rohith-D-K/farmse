import { FastifyInstance } from 'fastify';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../db/index';
import { helpReports, orders, products, reviews, sessions, users } from '../db/schema';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

export async function adminRoutes(fastify: FastifyInstance) {
    const requireAdmin = (request: AuthenticatedRequest, reply: any) => {
        if (request.user?.role !== 'admin') {
            reply.code(403).send({ error: 'Admin access required' });
            return false;
        }
        return true;
    };

    fastify.get('/api/admin/overview', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        try {
            if (!requireAdmin(request, reply)) return;

            const [allUsers, allOrders, allProducts, allReports] = await Promise.all([
                db.select().from(users),
                db.select().from(orders),
                db.select().from(products),
                db.select().from(helpReports)
            ]);

            const totalUsers = allUsers.length;
            const farmers = allUsers.filter(user => user.role === 'farmer').length;
            const buyers = allUsers.filter(user => user.role === 'buyer').length;
            const admins = allUsers.filter(user => user.role === 'admin').length;
            const activeUsers = allUsers.filter(user => user.isActive).length;
            const deactivatedUsers = allUsers.filter(user => !user.isActive).length;
            const openReports = allReports.filter(report => report.status === 'open').length;

            return reply.send({
                users: {
                    total: totalUsers,
                    farmers,
                    buyers,
                    admins,
                    active: activeUsers,
                    deactivated: deactivatedUsers
                },
                products: {
                    total: allProducts.length,
                    outOfStock: allProducts.filter(product => product.quantity <= 0).length
                },
                orders: {
                    total: allOrders.length,
                    pending: allOrders.filter(order => order.orderStatus === 'pending').length,
                    delivered: allOrders.filter(order => order.orderStatus === 'delivered').length,
                    rejected: allOrders.filter(order => order.orderStatus === 'rejected').length
                },
                reports: {
                    total: allReports.length,
                    open: openReports,
                    resolved: allReports.length - openReports
                }
            });
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    fastify.get('/api/admin/users', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        try {
            if (!requireAdmin(request, reply)) return;

            const allUsers = await db
                .select({
                    id: users.id,
                    email: users.email,
                    name: users.name,
                    phone: users.phone,
                    location: users.location,
                    role: users.role,
                    isActive: users.isActive,
                    createdAt: users.createdAt
                })
                .from(users)
                .orderBy(desc(users.createdAt));

            return reply.send(allUsers);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    fastify.delete('/api/admin/users/:id', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };

        try {
            if (!requireAdmin(request, reply)) return;

            if (id === request.user!.id) {
                return reply.code(400).send({ error: 'You cannot delete your own admin account' });
            }

            const [targetUser] = await db
                .select({ id: users.id, role: users.role })
                .from(users)
                .where(eq(users.id, id))
                .limit(1);

            if (!targetUser) {
                return reply.code(404).send({ error: 'User not found' });
            }

            if (targetUser.role === 'admin') {
                return reply.code(400).send({ error: 'Deleting admin users is not allowed' });
            }

            // Delete in correct order respecting foreign keys
            // 1. Get all order IDs for this user (as buyer or farmer)
            const buyerOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.buyerId, id));
            const farmerOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.farmerId, id));
            const farmerProducts = await db.select({ id: products.id }).from(products).where(eq(products.farmerId, id));

            const buyerOrderIds = buyerOrders.map(o => o.id);
            const farmerOrderIds = farmerOrders.map(o => o.id);
            const farmerProductIds = farmerProducts.map(o => o.id);
            const allOrderIds = [...new Set([...buyerOrderIds, ...farmerOrderIds])];

            let removedHelpReports = 0;
            let removedReviews = 0;
            let removedOrders = 0;
            let removedProducts = 0;
            let removedSessions = 0;

            // Delete sessions
            const sessionResult = await db.delete(sessions).where(eq(sessions.userId, id));
            removedSessions += (sessionResult as any).rowCount ?? 0;

            // Delete help reports by reporter or reported user
            const hr1 = await db.delete(helpReports).where(eq(helpReports.reporterId, id));
            removedHelpReports += (hr1 as any).rowCount ?? 0;
            const hr2 = await db.delete(helpReports).where(eq(helpReports.reportedUserId, id));
            removedHelpReports += (hr2 as any).rowCount ?? 0;

            // Delete help reports linked to user's orders
            if (allOrderIds.length > 0) {
                const hr3 = await db.delete(helpReports).where(inArray(helpReports.orderId, allOrderIds));
                removedHelpReports += (hr3 as any).rowCount ?? 0;
            }

            // Delete reviews linked to user's orders
            if (allOrderIds.length > 0) {
                const rv1 = await db.delete(reviews).where(inArray(reviews.orderId, allOrderIds));
                removedReviews += (rv1 as any).rowCount ?? 0;
            }
            const rv2 = await db.delete(reviews).where(eq(reviews.buyerId, id));
            removedReviews += (rv2 as any).rowCount ?? 0;

            // Delete reviews linked to farmer's products
            if (farmerProductIds.length > 0) {
                const rv3 = await db.delete(reviews).where(inArray(reviews.productId, farmerProductIds));
                removedReviews += (rv3 as any).rowCount ?? 0;
            }

            // Delete orders
            const o1 = await db.delete(orders).where(eq(orders.buyerId, id));
            removedOrders += (o1 as any).rowCount ?? 0;
            const o2 = await db.delete(orders).where(eq(orders.farmerId, id));
            removedOrders += (o2 as any).rowCount ?? 0;
            if (farmerProductIds.length > 0) {
                const o3 = await db.delete(orders).where(inArray(orders.productId, farmerProductIds));
                removedOrders += (o3 as any).rowCount ?? 0;
            }

            // Delete products
            const p1 = await db.delete(products).where(eq(products.farmerId, id));
            removedProducts += (p1 as any).rowCount ?? 0;

            // Delete user
            await db.delete(users).where(eq(users.id, id));

            return reply.send({
                message: 'User deleted successfully',
                deletedUserId: id,
                deletedCounts: {
                    removedHelpReports,
                    removedReviews,
                    removedOrders,
                    removedProducts,
                    removedSessions
                }
            });
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    fastify.put('/api/admin/users/:id/role', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };
        const { role } = request.body as { role: 'farmer' | 'buyer' };

        try {
            if (!requireAdmin(request, reply)) return;

            if (!['farmer', 'buyer'].includes(role)) {
                return reply.code(400).send({ error: 'Invalid role' });
            }

            await db.update(users).set({ role }).where(eq(users.id, id));

            const [updatedUser] = await db
                .select({
                    id: users.id,
                    email: users.email,
                    name: users.name,
                    phone: users.phone,
                    location: users.location,
                    role: users.role,
                    isActive: users.isActive,
                    createdAt: users.createdAt
                })
                .from(users)
                .where(eq(users.id, id))
                .limit(1);

            if (!updatedUser) {
                return reply.code(404).send({ error: 'User not found' });
            }

            return reply.send(updatedUser);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    fastify.get('/api/admin/reports', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        try {
            if (!requireAdmin(request, reply)) return;

            const reports = await db
                .select()
                .from(helpReports)
                .orderBy(desc(helpReports.createdAt));

            const reporterIds = [...new Set(reports.map(report => report.reporterId))];
            const reportedIds = [...new Set(reports.map(report => report.reportedUserId).filter(Boolean) as string[])];
            const allRelevantIds = [...new Set([...reporterIds, ...reportedIds])];

            const relatedUsers = allRelevantIds.length > 0
                ? await db
                    .select({ id: users.id, name: users.name, email: users.email })
                    .from(users)
                    .where(inArray(users.id, allRelevantIds))
                : [];

            const userMap = new Map(relatedUsers.map(user => [user.id, user]));

            return reply.send(
                reports.map(report => ({
                    ...report,
                    reporterName: userMap.get(report.reporterId)?.name || 'Unknown',
                    reporterEmail: userMap.get(report.reporterId)?.email || 'Unknown',
                    reportedUserName: report.reportedUserId ? userMap.get(report.reportedUserId)?.name || 'Unknown' : null,
                    reportedUserEmail: report.reportedUserId ? userMap.get(report.reportedUserId)?.email || 'Unknown' : null
                }))
            );
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    fastify.put('/api/admin/reports/:id/resolve', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };
        const { adminNotes } = request.body as { adminNotes?: string };

        try {
            if (!requireAdmin(request, reply)) return;

            await db
                .update(helpReports)
                .set({
                    status: 'resolved',
                    adminNotes: adminNotes || null,
                    resolvedAt: new Date().toISOString()
                })
                .where(eq(helpReports.id, id));

            const [updatedReport] = await db
                .select()
                .from(helpReports)
                .where(eq(helpReports.id, id))
                .limit(1);

            if (!updatedReport) {
                return reply.code(404).send({ error: 'Report not found' });
            }

            return reply.send(updatedReport);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });
}
