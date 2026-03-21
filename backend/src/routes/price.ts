import { FastifyInstance } from 'fastify';
import {
    calculateRecommendedPrice,
    recordCropSearch,
} from '../services/priceRecommendation';

export async function priceRoutes(fastify: FastifyInstance) {
    /**
     * GET /api/price/recommend?cropName=<name>&lat=<lat>&lng=<lng>
     *
     * Returns a recommended price based on nearby listings,
     * market prices, and demand factors.
     */
    fastify.get('/api/price/recommend', async (request, reply) => {
        const { cropName, lat, lng } = request.query as {
            cropName?: string;
            lat?: string;
            lng?: string;
        };

        if (!cropName || !lat || !lng) {
            return reply.code(400).send({
                error: 'cropName, lat, and lng query parameters are required',
            });
        }

        const latitude = Number(lat);
        const longitude = Number(lng);

        if (isNaN(latitude) || isNaN(longitude)) {
            return reply.code(400).send({ error: 'lat and lng must be valid numbers' });
        }

        try {
            const result = await calculateRecommendedPrice({
                cropName,
                lat: latitude,
                lng: longitude,
            });
            return reply.send(result);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    /**
     * POST /api/price/search-track
     * Body: { cropName: string }
     *
     * Records a buyer search for demand tracking.
     */
    fastify.post('/api/price/search-track', async (request, reply) => {
        const { cropName } = request.body as { cropName?: string };

        if (!cropName || !cropName.trim()) {
            return reply.code(400).send({ error: 'cropName is required' });
        }

        try {
            await recordCropSearch(cropName.trim());
            return reply.send({ ok: true });
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });
}
