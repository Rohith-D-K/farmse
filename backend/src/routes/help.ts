import { FastifyInstance } from 'fastify';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db/index';
import { helpReports, users } from '../db/schema';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { generateId } from '../utils/auth';

export async function helpRoutes(fastify: FastifyInstance) {
    fastify.post('/api/help/reports', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { reportedUserId, orderId, category, description } = request.body as {
            reportedUserId?: string;
            orderId?: string;
            category: 'scam' | 'payment_issue' | 'delivery_issue' | 'other';
            description: string;
        };

        try {
            if (request.user!.role !== 'buyer') {
                return reply.code(403).send({ error: 'Only buyers can submit support reports' });
            }

            if (!description || description.trim().length < 10) {
                return reply.code(400).send({ error: 'Description must be at least 10 characters' });
            }

            if (!['scam', 'payment_issue', 'delivery_issue', 'other'].includes(category)) {
                return reply.code(400).send({ error: 'Invalid report category' });
            }

            if (reportedUserId) {
                const [reportedUser] = await db
                    .select({ id: users.id })
                    .from(users)
                    .where(eq(users.id, reportedUserId))
                    .limit(1);

                if (!reportedUser) {
                    return reply.code(404).send({ error: 'Reported user not found' });
                }
            }

            const reportId = generateId();
            await db.insert(helpReports).values({
                id: reportId,
                reporterId: request.user!.id,
                reportedUserId: reportedUserId || null,
                orderId: orderId || null,
                category,
                description: description.trim(),
                status: 'open'
            });

            const [report] = await db
                .select()
                .from(helpReports)
                .where(eq(helpReports.id, reportId))
                .limit(1);

            return reply.code(201).send(report);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    fastify.get('/api/help/my-reports', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        try {
            if (request.user!.role !== 'buyer') {
                return reply.code(403).send({ error: 'Only buyers can view support reports' });
            }

            const reports = await db
                .select()
                .from(helpReports)
                .where(eq(helpReports.reporterId, request.user!.id))
                .orderBy(desc(helpReports.createdAt));

            return reply.send(reports);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });
}
