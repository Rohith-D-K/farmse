import { FastifyInstance } from 'fastify';
import { db } from '../db/index';
import { preorders } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function communityRoutes(fastify: FastifyInstance) {
    fastify.get('/api/community/:harvestId', async (request, reply) => {
        const { harvestId } = request.params as { harvestId: string };
        
        const allPreorders = await db.select().from(preorders).where(eq(preorders.harvestId, harvestId));
        let totalJoinedQuantity = 0;
        allPreorders.forEach(p => {
            if (p.status !== 'cancelled') {
                totalJoinedQuantity += p.quantity;
            }
        });
        
        let discountPercent = 0;
        let discountTierTitle = 'No Discount';
        if (totalJoinedQuantity > 500) { discountPercent = 15; discountTierTitle = '15% Discount Block'; }
        else if (totalJoinedQuantity > 300) { discountPercent = 10; discountTierTitle = '10% Discount Block'; }
        else if (totalJoinedQuantity > 100) { discountPercent = 5; discountTierTitle = '5% Discount Block'; }

        return reply.send({ totalJoinedQuantity, discountPercent, discountTierTitle });
    });
}
