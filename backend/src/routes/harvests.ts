import { FastifyInstance } from 'fastify';
import { db } from '../db/index';
import { harvests, preorders, orders as ordersTable } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { authenticate, AuthenticatedRequest, requireFarmer, allowBuyerOnly } from '../middleware/auth';
import { generateId } from '../utils/auth';

export async function harvestRoutes(fastify: FastifyInstance) {
    // POST /api/harvest/create
    fastify.post('/api/harvest/create', { preHandler: [authenticate, requireFarmer] }, async (request: AuthenticatedRequest, reply) => {
        const farmerId = request.user!.id;
        const body = request.body as any;
        const id = generateId();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const expectedDate = new Date(body.expectedHarvestDate);
        const deadlineDate = new Date(body.preorderDeadline);
        
        const diffDaysExpected = (expectedDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
        if (diffDaysExpected < 7 || diffDaysExpected > 30) {
            return reply.code(400).send({ error: 'Expected harvest date must be between 7 and 30 days from today' });
        }

        const diffDaysDeadline = (expectedDate.getTime() - deadlineDate.getTime()) / (1000 * 3600 * 24);
        if (diffDaysDeadline < 7) {
            return reply.code(400).send({ error: 'Preorder deadline must be at least 7 days before the expected harvest date' });
        }

        if (deadlineDate < today) {
            return reply.code(400).send({ error: 'Preorder deadline cannot be in the past' });
        }

        if (body.minPreorderQuantity > body.estimatedQuantity) {
            return reply.code(400).send({ error: 'Min preorder quantity cannot exceed estimated quantity' });
        }
        if (body.basePricePerKg <= 0 || body.estimatedQuantity <= 0 || body.minPreorderQuantity <= 0) {
            return reply.code(400).send({ error: 'Quantities and prices must be greater than 0' });
        }

        await db.insert(harvests).values({
            id,
            farmerId,
            cropName: body.cropName,
            expectedHarvestDate: body.expectedHarvestDate,
            estimatedQuantity: body.estimatedQuantity,
            basePricePerKg: body.basePricePerKg,
            minPreorderQuantity: body.minPreorderQuantity,
            preorderDeadline: body.preorderDeadline,
            location: body.location,
            latitude: body.latitude,
            longitude: body.longitude,
            description: body.description,
            image: body.image
        });
        
        return reply.send({ id, message: 'Harvest created successfully' });
    });

    // GET /api/harvest/all
    fastify.get('/api/harvest/all', async (request, reply) => {
        const allHarvests = await db.select().from(harvests);
        
        // Auto-update status for expired deadlines (Part 8)
        const today = new Date();
        const updatedHarvests = await Promise.all(allHarvests.map(async h => {
            if (h.status === 'open' && new Date(h.preorderDeadline) < today) {
                await db.update(harvests).set({ status: 'closed' }).where(eq(harvests.id, h.id));
                return { ...h, status: 'closed' };
            }
            if (h.status === 'closed' && new Date(h.expectedHarvestDate) < today) {
                await db.update(harvests).set({ status: 'completed' }).where(eq(harvests.id, h.id));
                return { ...h, status: 'completed' };
            }
            return h;
        }));

        return reply.send(updatedHarvests);
    });

    // GET /api/harvest/:id
    fastify.get('/api/harvest/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const [harvest] = await db.select().from(harvests).where(eq(harvests.id, id)).limit(1);
        if (!harvest) return reply.code(404).send({ error: 'Harvest not found' });
        return reply.send(harvest);
    });

    // POST /api/harvest/preorder
    fastify.post('/api/harvest/preorder', { preHandler: [authenticate, allowBuyerOnly] }, async (request: AuthenticatedRequest, reply) => {
        const { harvestId, quantity, deliveryMethod, isRetailer, retailerProfileId } = request.body as any;
        const buyerId = request.user!.id;

        const [harvest] = await db.select().from(harvests).where(eq(harvests.id, harvestId)).limit(1);
        if (!harvest) return reply.code(404).send({ error: 'Harvest not found' });
        
        if (new Date() > new Date(harvest.preorderDeadline)) {
            return reply.code(400).send({ error: 'Preorder deadline has passed' });
        }

        const allPreorders = await db.select().from(preorders).where(eq(preorders.harvestId, harvestId));
        let totalPreordered = 0;
        allPreorders.forEach(p => { if (p.status !== 'cancelled') totalPreordered += p.quantity; });
        
        const remaining = harvest.estimatedQuantity - totalPreordered;

        if (quantity > remaining) {
            return reply.code(400).send({ error: `Only ${remaining}kg remaining for preorder` });
        }

        if (quantity < harvest.minPreorderQuantity && remaining >= harvest.minPreorderQuantity) {
            return reply.code(400).send({ error: `Minimum preorder quantity is ${harvest.minPreorderQuantity}kg` });
        }

        // Compute bulk retailer discount based on quantity tiers
        let discountPercent = 0;
        let deliveryPriority: 'normal' | 'high' = 'normal';
        let isBulkRetailerOrder = false;

        if (isRetailer === true && quantity > 5) {
            // Check if verified
            const [profile] = await db.select().from(sql`retailer_profiles`)
                .where(eq(sql`buyer_id`, buyerId))
                .limit(1) as any[];
            
            if (profile && profile.verification_status === 'verified') {
                isBulkRetailerOrder = true;
                if (quantity > 100) discountPercent = 20;
                else if (quantity > 50) discountPercent = 15;
                else if (quantity > 20) discountPercent = 10;
                else discountPercent = 5; // 5–20 kg
                deliveryPriority = 'high';
            }
        }

        const pricePerKg = harvest.basePricePerKg * (1 - discountPercent / 100);
        const totalPrice = pricePerKg * quantity;

        const preorderId = generateId();

        await db.insert(preorders).values({
            id: preorderId,
            harvestId,
            buyerId,
            quantity,
            deliveryMethod: deliveryMethod || 'buyer_pickup',
            status: 'reserved',
            isBulk: quantity > 5,
            isBulkRetailer: isBulkRetailerOrder,
            retailerProfileId: retailerProfileId || null,
            deliveryPriority,
            discountPercent
        });


        // Also create a unified order for tracking
        const orderId = generateId();
        const otpValue = Math.floor(1000 + Math.random() * 9000).toString();
        
        await db.execute(sql`
            INSERT INTO orders (id, harvest_id, farmer_id, buyer_id, quantity, total_price, delivery_method, payment_method, payment_status, order_status, order_type, otp)
            VALUES (${orderId}, ${harvestId}, ${harvest.farmerId}, ${buyerId}, ${quantity}, ${totalPrice}, ${deliveryMethod || 'buyer_pickup'}, 'upi', 'pending', 'pending', 'preorder', ${otpValue})
        `);

        return reply.send({ 
            id: preorderId, 
            orderId, 
            discountPercent,
            deliveryPriority,
            totalPrice,
            pricePerKg,
            message: 'Preorder placed successfully' 
        });
    });


    // GET /api/harvest/:id/preorders
    fastify.get('/api/harvest/:id/preorders', { preHandler: authenticate }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };
        const [harvest] = await db.select().from(harvests).where(eq(harvests.id, id)).limit(1);
        if (!harvest) return reply.code(404).send({ error: 'Harvest not found' });
        
        if (request.user!.role !== 'admin' && harvest.farmerId !== request.user!.id) {
            return reply.code(403).send({ error: 'You do not have permission to view these preorders' });
        }

        const list = await db.select().from(preorders).where(eq(preorders.harvestId, id));
        return reply.send(list);
    });

    // GET /api/harvest/:id/stats
    fastify.get('/api/harvest/:id/stats', async (request, reply) => {
        const { id } = request.params as { id: string };
        const [harvest] = await db.select().from(harvests).where(eq(harvests.id, id)).limit(1);
        if (!harvest) return reply.code(404).send({ error: 'Harvest not found' });

        const allPreorders = await db.select().from(preorders).where(eq(preorders.harvestId, id));
        let totalPreordered = 0;
        allPreorders.forEach(p => {
            if (p.status !== 'cancelled') {
                totalPreordered += p.quantity;
            }
        });

        const remainingQuantity = Math.max(0, harvest.estimatedQuantity - totalPreordered);
        const demandPercent = (totalPreordered / harvest.estimatedQuantity) * 100;
        
        let demandLevel = 'Low Demand';
        if (demandPercent > 70) demandLevel = 'High Demand';
        else if (demandPercent >= 40) demandLevel = 'Medium Demand';

        const isSafe = demandPercent >= 60;

        let discountPercent = 0;
        if (totalPreordered > 500) discountPercent = 0.15;
        else if (totalPreordered > 300) discountPercent = 0.10;
        else if (totalPreordered > 100) discountPercent = 0.05;

        const discountedPrice = harvest.basePricePerKg * (1 - discountPercent);

        return reply.send({
            totalPreordered,
            remainingQuantity,
            demandPercent,
            demandLevel,
            isSafe,
            discountPercent,
            discountedPrice,
            basePrice: harvest.basePricePerKg,
            status: harvest.status
        });
    });

    // POST /api/harvest/:id/cancel (Farmer cancellation)
    fastify.post('/api/harvest/:id/cancel', { preHandler: authenticate }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };
        const farmerId = request.user!.id;

        const [harvest] = await db.select().from(harvests).where(eq(harvests.id, id)).limit(1);
        if (!harvest) return reply.code(404).send({ error: 'Harvest not found' });
        
        if (harvest.farmerId !== farmerId && request.user!.role !== 'admin') {
            return reply.code(403).send({ error: 'Unauthorized' });
        }

        const allPreorders = await db.select().from(preorders).where(eq(preorders.harvestId, id));
        let totalPreordered = 0;
        allPreorders.forEach(p => { if (p.status !== 'cancelled') totalPreordered += p.quantity; });

        const percentReserved = (totalPreordered / harvest.estimatedQuantity) * 100;
        if (percentReserved >= 60 && request.user!.role !== 'admin') {
            return reply.code(400).send({ error: 'Cannot cancel harvest: 60% or more is already reserved. Contact Admin.' });
        }

        await db.update(harvests).set({ status: 'cancelled' }).where(eq(harvests.id, id));
        await db.update(preorders).set({ status: 'cancelled' }).where(eq(preorders.harvestId, id));
        
        return reply.send({ message: 'Harvest cancelled successfully' });
    });

    // POST /api/harvest/preorder/:id/cancel (Buyer cancellation)
    fastify.post('/api/harvest/preorder/:id/cancel', { preHandler: authenticate }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };
        const buyerId = request.user!.id;

        const [preorder] = await db.select().from(preorders).where(eq(preorders.id, id)).limit(1);
        if (!preorder) return reply.code(404).send({ error: 'Preorder not found' });
        if (preorder.buyerId !== buyerId && request.user!.role !== 'admin') {
            return reply.code(403).send({ error: 'Unauthorized' });
        }

        const [harvest] = await db.select().from(harvests).where(eq(harvests.id, preorder.harvestId)).limit(1);
        
        if (new Date() > new Date(harvest.preorderDeadline)) {
            return reply.code(400).send({ error: 'Cannot cancel after preorder deadline' });
        }

        await db.update(preorders).set({ status: 'cancelled' }).where(eq(preorders.id, id));
        return reply.send({ message: 'Preorder cancelled successfully' });
    });

    // DELETE /api/harvest/:id
    fastify.delete('/api/harvest/:id', { preHandler: [authenticate, requireFarmer] }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };
        const farmerId = request.user!.id;
        
        const [harvest] = await db.select().from(harvests).where(eq(harvests.id, id)).limit(1);
        if (!harvest) return reply.code(404).send({ error: 'Harvest not found' });
        
        if (harvest.farmerId !== farmerId && request.user!.role !== 'admin') {
            return reply.code(403).send({ error: 'Unauthorized to delete this harvest' });
        }
        
        const allPreorders = await db.select().from(preorders).where(eq(preorders.harvestId, id));
        let totalPreordered = 0;
        allPreorders.forEach(p => { if (p.status !== 'cancelled') totalPreordered += p.quantity; });
        
        if (totalPreordered > 0) {
            return reply.code(400).send({ error: 'Cannot delete harvest with active preorders. Cancel it instead.' });
        }
        
        await db.delete(harvests).where(eq(harvests.id, id));
        return reply.send({ message: 'Harvest deleted successfully' });
    });

    // PUT /api/harvest/:id
    fastify.put('/api/harvest/:id', { preHandler: [authenticate, requireFarmer] }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };
        const farmerId = request.user!.id;
        const body = request.body as any;

        const [harvest] = await db.select().from(harvests).where(eq(harvests.id, id)).limit(1);
        if (!harvest) return reply.code(404).send({ error: 'Harvest not found' });
        
        if (harvest.farmerId !== farmerId && request.user!.role !== 'admin') {
            return reply.code(403).send({ error: 'Unauthorized to edit this harvest' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const expectedDate = new Date(body.expectedHarvestDate);
        const deadlineDate = new Date(body.preorderDeadline);
        
        const diffDaysExpected = (expectedDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
        if (diffDaysExpected < 7 || diffDaysExpected > 60) {
            return reply.code(400).send({ error: 'Expected harvest date must be between 7 and 60 days from today' });
        }

        const diffDaysDeadline = (expectedDate.getTime() - deadlineDate.getTime()) / (1000 * 3600 * 24);
        if (diffDaysDeadline < 7) {
            return reply.code(400).send({ error: 'Preorder deadline must be at least 7 days before the expected harvest date' });
        }

        if (body.minPreorderQuantity > body.estimatedQuantity) {
            return reply.code(400).send({ error: 'Min preorder quantity cannot exceed estimated quantity' });
        }

        await db.update(harvests).set({
            cropName: body.cropName,
            expectedHarvestDate: body.expectedHarvestDate,
            estimatedQuantity: body.estimatedQuantity,
            basePricePerKg: body.basePricePerKg,
            minPreorderQuantity: body.minPreorderQuantity,
            preorderDeadline: body.preorderDeadline,
            location: body.location,
            latitude: body.latitude,
            longitude: body.longitude,
            description: body.description,
            image: body.image
        }).where(eq(harvests.id, id));
        
        return reply.send({ message: 'Harvest updated successfully' });
    });
}
