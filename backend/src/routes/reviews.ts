import { FastifyInstance } from 'fastify';
import { db } from '../db/index';
import { reviews, orders } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { generateId } from '../utils/auth';

export async function reviewRoutes(fastify: FastifyInstance) {
    // Create review
    fastify.post('/api/reviews', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { orderId, productId, rating, comment } = request.body as {
            orderId: string;
            productId: string;
            rating: number;
            comment?: string;
        };

        try {
            if (request.user!.role !== 'buyer') {
                return reply.code(403).send({ error: 'Only buyers can leave reviews' });
            }

            // Verify order belongs to buyer
            const [order] = await db
                .select()
                .from(orders)
                .where(eq(orders.id, orderId))
                .limit(1);

            if (!order) {
                return reply.code(404).send({ error: 'Order not found' });
            }

            if (order.buyerId !== request.user!.id) {
                return reply.code(403).send({ error: 'Not authorized' });
            }

            if (order.orderStatus !== 'delivered') {
                return reply.code(400).send({ error: 'Can only review delivered orders' });
            }

            // Create review
            const reviewId = generateId();
            await db.insert(reviews).values({
                id: reviewId,
                orderId,
                productId,
                buyerId: request.user!.id,
                rating,
                comment: comment || null
            });

            // Update order status to completed
            await db
                .update(orders)
                .set({ orderStatus: 'completed' })
                .where(eq(orders.id, orderId));

            const [newReview] = await db
                .select()
                .from(reviews)
                .where(eq(reviews.id, reviewId))
                .limit(1);

            return reply.send(newReview);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Get reviews for a product
    fastify.get('/api/reviews/product/:productId', async (request, reply) => {
        const { productId } = request.params as { productId: string };

        try {
            const productReviews = await db
                .select()
                .from(reviews)
                .where(eq(reviews.productId, productId));

            return reply.send(productReviews);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });
}
