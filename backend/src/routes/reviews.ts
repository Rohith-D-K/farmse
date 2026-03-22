import { FastifyInstance } from 'fastify';
import { db } from '../db/index';
import { reviews, orders, products, users, harvests } from '../db/schema';
import { eq, desc, or, sql } from 'drizzle-orm';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { generateId } from '../utils/auth';

export async function reviewRoutes(fastify: FastifyInstance) {
    // Create review
    fastify.post('/api/reviews', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { orderId, productId, harvestId, rating, comment } = request.body as {
            orderId: string;
            productId?: string;
            harvestId?: string;
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

            if (order.orderStatus !== 'delivered' && order.orderStatus !== 'completed') {
                return reply.code(400).send({ error: 'Can only review delivered or completed orders' });
            }

            // Create review
            const reviewId = generateId();
            await db.insert(reviews).values({
                id: reviewId,
                orderId,
                productId: productId || null,
                harvestId: harvestId || order.harvestId || null,
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
                .where(or(
                    eq(reviews.productId, productId),
                    eq(reviews.harvestId, productId)
                ));

            return reply.send(productReviews);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });
    // Get reviews for a farmer
    fastify.get('/api/reviews/farmer/:farmerId', async (request, reply) => {
        const { farmerId } = request.params as { farmerId: string };

        try {
            const farmerReviews = await db
                .select({
                    id: reviews.id,
                    rating: reviews.rating,
                    comment: reviews.comment,
                    createdAt: reviews.createdAt,
                    productName: sql<string>`COALESCE(${products.cropName}, ${harvests.cropName})`,
                    orderId: reviews.orderId,
                    buyerName: users.name
                })
                .from(reviews)
                .leftJoin(products, eq(reviews.productId, products.id))
                .leftJoin(harvests, eq(reviews.harvestId, harvests.id))
                .leftJoin(users, eq(reviews.buyerId, users.id))
                .where(or(
                    eq(products.farmerId, farmerId),
                    eq(harvests.farmerId, farmerId)
                ))
                .orderBy(desc(reviews.createdAt));

            const avgRating = farmerReviews.length > 0
                ? farmerReviews.reduce((acc, curr) => acc + curr.rating, 0) / farmerReviews.length
                : 0;

            return reply.send({
                reviews: farmerReviews,
                averageRating: Number(avgRating.toFixed(1)),
                totalReviews: farmerReviews.length
            });
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });
}
