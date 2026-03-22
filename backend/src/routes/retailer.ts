import { FastifyInstance } from 'fastify';
import { db } from '../db/index';
import { preorders, negotiations, subscriptions, harvests } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticate, AuthenticatedRequest, requireRetailer } from '../middleware/auth';
import { generateId } from '../utils/auth';

export async function retailerRoutes(fastify: FastifyInstance) {
    // POST /api/retailer/bulk-order
    fastify.post('/api/retailer/bulk-order', { preHandler: [authenticate, requireRetailer] }, async (request: AuthenticatedRequest, reply) => {
        const { harvestId, quantity, deliveryMethod } = request.body as any;
        const retailerId = request.user!.id;
        
        const [harvest] = await db.select().from(harvests).where(eq(harvests.id, harvestId)).limit(1);
        if (!harvest) return reply.code(404).send({ error: 'Harvest not found' });
        
        const id = generateId();
        await db.insert(preorders).values({
            id,
            harvestId,
            buyerId: retailerId,
            quantity,
            deliveryMethod,
            status: 'reserved',
            isBulk: true
        });
        
        return reply.send({ id, message: 'Bulk order placed successfully' });
    });

    // POST /api/retailer/negotiate
    fastify.post('/api/retailer/negotiate', { preHandler: [authenticate, requireRetailer] }, async (request: AuthenticatedRequest, reply) => {
        const { harvestId, farmerId, offerPrice, quantity, message } = request.body as any;
        const retailerId = request.user!.id;
        
        const id = generateId();
        await db.insert(negotiations).values({
            id,
            harvestId,
            retailerId,
            farmerId,
            offerPrice,
            quantity,
            message,
            status: 'pending'
        });
        
        return reply.send({ id, message: 'Negotiation offer sent to farmer' });
    });

    // POST /api/retailer/subscription
    fastify.post('/api/retailer/subscription', { preHandler: [authenticate, requireRetailer] }, async (request: AuthenticatedRequest, reply) => {
        const { farmerId, cropName, quantity, frequency, duration } = request.body as any;
        const retailerId = request.user!.id;
        
        const id = generateId();
        await db.insert(subscriptions).values({
            id,
            farmerId,
            retailerId,
            cropName,
            quantity,
            frequency,
            duration,
            status: 'active'
        });
        
        return reply.send({ id, message: 'Subscription order created successfully' });
    });

    // GET /api/retailer/analytics
    fastify.get('/api/retailer/analytics', { preHandler: [authenticate, requireRetailer] }, async (request: AuthenticatedRequest, reply) => {
        const retailerId = request.user!.id;
        
        const retailerPreorders = await db.select().from(preorders).where(eq(preorders.buyerId, retailerId));
        
        let totalOrders = retailerPreorders.length;
        let totalQuantityPurchased = 0;
        let moneySpent = 0;
        const cropCounts: Record<string, number> = {};
        
        for (const order of retailerPreorders) {
            totalQuantityPurchased += order.quantity;
            const [harvest] = await db.select().from(harvests).where(eq(harvests.id, order.harvestId)).limit(1);
            if (harvest) {
                moneySpent += order.quantity * harvest.basePricePerKg;
                cropCounts[harvest.cropName] = (cropCounts[harvest.cropName] || 0) + order.quantity;
            }
        }
        
        let mostPurchasedCrop = 'None';
        let maxCount = 0;
        for (const [crop, count] of Object.entries(cropCounts)) {
            if (count > maxCount) {
                maxCount = count;
                mostPurchasedCrop = crop;
            }
        }
        
        return reply.send({
            totalOrders,
            totalQuantityPurchased,
            moneySpent,
            mostPurchasedCrop,
            monthlyPurchaseChart: [
                { month: 'Jan', amount: Math.floor(totalQuantityPurchased/2) },
                { month: 'Feb', amount: Math.floor(totalQuantityPurchased/1.5) },
                { month: 'Mar', amount: totalQuantityPurchased }
            ]
        });
    });
}
