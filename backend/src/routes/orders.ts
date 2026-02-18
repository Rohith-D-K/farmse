import { FastifyInstance } from 'fastify';
import { db } from '../db/index';
import { orders, products } from '../db/schema';
import { eq, or, and } from 'drizzle-orm';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { generateId } from '../utils/auth';

export async function orderRoutes(fastify: FastifyInstance) {
    // Get user's orders
    fastify.get('/api/orders', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        try {
            let userOrders;

            if (request.user!.role === 'farmer') {
                // Get orders for farmer's products
                userOrders = await db
                    .select()
                    .from(orders)
                    .where(eq(orders.farmerId, request.user!.id));
            } else {
                // Get buyer's orders
                userOrders = await db
                    .select()
                    .from(orders)
                    .where(eq(orders.buyerId, request.user!.id));
            }

            return reply.send(userOrders);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Create order
    fastify.post('/api/orders', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { productId, quantity, deliveryMethod, paymentMethod } = request.body as {
            productId: string;
            quantity: number;
            deliveryMethod: 'buyer_pickup' | 'farmer_delivery' | 'local_transport';
            paymentMethod: 'upi' | 'bank_transfer';
        };

        try {
            if (request.user!.role !== 'buyer') {
                return reply.code(403).send({ error: 'Only buyers can create orders' });
            }

            // Get product
            const [product] = await db
                .select()
                .from(products)
                .where(eq(products.id, productId))
                .limit(1);

            if (!product) {
                return reply.code(404).send({ error: 'Product not found' });
            }

            if (product.quantity < quantity) {
                return reply.code(400).send({ error: 'Insufficient quantity' });
            }

            // Calculate total price
            const totalPrice = product.price * quantity;

            // Create order
            const orderId = generateId();
            await db.insert(orders).values({
                id: orderId,
                productId,
                farmerId: product.farmerId,
                buyerId: request.user!.id,
                quantity,
                totalPrice,
                deliveryMethod,
                paymentMethod,
                paymentStatus: 'completed',
                orderStatus: 'pending'
            });

            // Update product quantity
            await db
                .update(products)
                .set({ quantity: product.quantity - quantity })
                .where(eq(products.id, productId));

            const [newOrder] = await db
                .select()
                .from(orders)
                .where(eq(orders.id, orderId))
                .limit(1);

            return reply.send(newOrder);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Accept order (farmer only)
    fastify.put('/api/orders/:id/accept', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };

        try {
            if (request.user!.role !== 'farmer') {
                return reply.code(403).send({ error: 'Only farmers can accept orders' });
            }

            const [order] = await db
                .select()
                .from(orders)
                .where(eq(orders.id, id))
                .limit(1);

            if (!order) {
                return reply.code(404).send({ error: 'Order not found' });
            }

            if (order.farmerId !== request.user!.id) {
                return reply.code(403).send({ error: 'Not authorized' });
            }

            await db
                .update(orders)
                .set({ orderStatus: 'accepted' })
                .where(eq(orders.id, id));

            const [updatedOrder] = await db
                .select()
                .from(orders)
                .where(eq(orders.id, id))
                .limit(1);

            return reply.send(updatedOrder);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Mark as delivered (farmer only)
    fastify.put('/api/orders/:id/deliver', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };

        try {
            if (request.user!.role !== 'farmer') {
                return reply.code(403).send({ error: 'Only farmers can mark orders as delivered' });
            }

            const [order] = await db
                .select()
                .from(orders)
                .where(eq(orders.id, id))
                .limit(1);

            if (!order) {
                return reply.code(404).send({ error: 'Order not found' });
            }

            if (order.farmerId !== request.user!.id) {
                return reply.code(403).send({ error: 'Not authorized' });
            }

            await db
                .update(orders)
                .set({ orderStatus: 'delivered' })
                .where(eq(orders.id, id));

            const [updatedOrder] = await db
                .select()
                .from(orders)
                .where(eq(orders.id, id))
                .limit(1);

            return reply.send(updatedOrder);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Reject order (farmer only)
    fastify.put('/api/orders/:id/reject', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };

        try {
            if (request.user!.role !== 'farmer') {
                return reply.code(403).send({ error: 'Only farmers can reject orders' });
            }

            const [order] = await db
                .select()
                .from(orders)
                .where(eq(orders.id, id))
                .limit(1);

            if (!order) {
                return reply.code(404).send({ error: 'Order not found' });
            }

            if (order.farmerId !== request.user!.id) {
                return reply.code(403).send({ error: 'Not authorized' });
            }

            await db
                .update(orders)
                .set({ orderStatus: 'rejected' })
                .where(eq(orders.id, id));

            const [updatedOrder] = await db
                .select()
                .from(orders)
                .where(eq(orders.id, id))
                .limit(1);

            return reply.send(updatedOrder);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });
}
