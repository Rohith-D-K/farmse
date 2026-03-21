import { FastifyInstance } from 'fastify';
import { db } from '../db/index';
import { products, users, sessions } from '../db/schema';
import { eq, and, gt, sql } from 'drizzle-orm';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { generateId } from '../utils/auth';
import { haversineDistance } from '../utils/haversine';

export async function productRoutes(fastify: FastifyInstance) {
    // Get all products (with 10km proximity filter for authenticated buyers)
    fastify.get('/api/products', async (request, reply) => {
        try {
            const allProducts = await db
                .select({
                    id: products.id,
                    farmerId: products.farmerId,
                    cropName: products.cropName,
                    price: products.price,
                    quantity: products.quantity,
                    location: products.location,
                    image: products.image,
                    createdAt: products.createdAt
                })
                .from(products)
                .where(gt(products.quantity, 0));

            // Try to get buyer location from auth token for proximity filter
            const authHeader = request.headers.authorization;
            if (authHeader) {
                const token = authHeader.replace('Bearer ', '');
                const [session] = await db
                    .select()
                    .from(sessions)
                    .where(eq(sessions.id, token))
                    .limit(1);

                if (session) {
                    const [user] = await db
                        .select()
                        .from(users)
                        .where(eq(users.id, session.userId))
                        .limit(1);

                    if (user && user.role === 'buyer' && user.latitude && user.longitude) {
                        // Get all farmers with locations
                        const allFarmers = await db
                            .select({ id: users.id, latitude: users.latitude, longitude: users.longitude })
                            .from(users)
                            .where(eq(users.role, 'farmer'));

                        const nearbyFarmerIds = new Set(
                            allFarmers
                                .filter(f => f.latitude && f.longitude &&
                                    haversineDistance(user.latitude!, user.longitude!, f.latitude!, f.longitude!) <= 10)
                                .map(f => f.id)
                        );

                        const filtered = allProducts.filter(p => nearbyFarmerIds.has(p.farmerId));
                        return reply.send(filtered);
                    }
                }
            }

            return reply.send(allProducts);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Suggest price based on 200km radius average
    fastify.get('/api/products/suggest-price', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { cropName: queryCrop } = request.query as { cropName: string };

        if (!queryCrop) {
            return reply.code(400).send({ error: 'cropName query param is required' });
        }

        try {
            const farmer = request.user!;
            if (!farmer.latitude || !farmer.longitude) {
                return reply.code(400).send({ error: 'Farmer location not set' });
            }

            // Get all products matching the crop name with their farmer locations
            const matchingProducts = await db
                .select({
                    price: products.price,
                    farmerId: products.farmerId
                })
                .from(products)
                .where(sql`LOWER(${products.cropName}) = LOWER(${queryCrop})`);

            // Get farmer locations
            const farmerIds = [...new Set(matchingProducts.map(p => p.farmerId))];
            const farmers = farmerIds.length > 0
                ? await db.select({ id: users.id, latitude: users.latitude, longitude: users.longitude }).from(users).where(sql`${users.id} IN (${sql.join(farmerIds.map(id => sql`${id}`), sql`, `)})`)
                : [];

            const farmerMap = new Map(farmers.map(f => [f.id, f]));

            // Filter to products from farmers within 200km
            const nearbyPrices = matchingProducts.filter(p => {
                const f = farmerMap.get(p.farmerId);
                if (!f || !f.latitude || !f.longitude) return false;
                return haversineDistance(farmer.latitude!, farmer.longitude!, f.latitude!, f.longitude!) <= 200;
            }).map(p => p.price);

            if (nearbyPrices.length === 0) {
                return reply.send({ suggestedPrice: null, minPrice: null, maxPrice: null, count: 0, message: 'No listings found within 200km for this crop' });
            }

            const avg = nearbyPrices.reduce((a, b) => a + b, 0) / nearbyPrices.length;
            const minPrice = Math.min(...nearbyPrices);
            const maxPrice = Math.max(...nearbyPrices);
            return reply.send({
                suggestedPrice: Math.round(avg * 100) / 100,
                minPrice: Math.round(minPrice * 100) / 100,
                maxPrice: Math.round(maxPrice * 100) / 100,
                count: nearbyPrices.length,
                message: `Based on ${nearbyPrices.length} listing${nearbyPrices.length > 1 ? 's' : ''} within 200km`
            });
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Get farmer's products
    fastify.get('/api/products/my', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        try {
            const farmerProducts = await db
                .select()
                .from(products)
                .where(eq(products.farmerId, request.user!.id));

            return reply.send(farmerProducts);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Get single product
    fastify.get('/api/products/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        try {
            const [product] = await db
                .select()
                .from(products)
                .where(eq(products.id, id))
                .limit(1);

            if (!product) {
                return reply.code(404).send({ error: 'Product not found' });
            }

            return reply.send(product);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Create product
    fastify.post('/api/products', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { cropName, price, quantity, location, image } = request.body as {
            cropName: string;
            price: number;
            quantity: number;
            location: string;
            image: string;
        };

        try {
            if (request.user!.role !== 'farmer') {
                return reply.code(403).send({ error: 'Only farmers can create products' });
            }

            const productId = generateId();
            await db.insert(products).values({
                id: productId,
                farmerId: request.user!.id,
                cropName,
                price,
                quantity,
                location,
                image
            });

            const [newProduct] = await db
                .select()
                .from(products)
                .where(eq(products.id, productId))
                .limit(1);

            return reply.send(newProduct);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Update product
    fastify.put('/api/products/:id', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };
        const { cropName, price, quantity, location, image } = request.body as {
            cropName: string;
            price: number;
            quantity: number;
            location: string;
            image: string;
        };

        try {
            // Check ownership
            const [product] = await db
                .select()
                .from(products)
                .where(eq(products.id, id))
                .limit(1);

            if (!product) {
                return reply.code(404).send({ error: 'Product not found' });
            }

            if (product.farmerId !== request.user!.id) {
                return reply.code(403).send({ error: 'Not authorized' });
            }

            await db
                .update(products)
                .set({ cropName, price, quantity, location, image })
                .where(eq(products.id, id));

            const [updatedProduct] = await db
                .select()
                .from(products)
                .where(eq(products.id, id))
                .limit(1);

            return reply.send(updatedProduct);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Delete product
    fastify.delete('/api/products/:id', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };

        try {
            // Check ownership
            const [product] = await db
                .select()
                .from(products)
                .where(eq(products.id, id))
                .limit(1);

            if (!product) {
                return reply.code(404).send({ error: 'Product not found' });
            }

            if (product.farmerId !== request.user!.id) {
                return reply.code(403).send({ error: 'Not authorized' });
            }

            await db.delete(products).where(eq(products.id, id));

            return reply.send({ message: 'Product deleted successfully' });
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Search for a crop image from Wikipedia (no auth needed for image resolution)
    fastify.get('/api/products/crop-image', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { name } = request.query as { name: string };
        if (!name || name.trim().length < 2) {
            return reply.code(400).send({ error: 'name query param is required (min 2 chars)' });
        }

        try {
            const searchTerm = encodeURIComponent(name.trim());
            const res = await fetch(
                `https://en.wikipedia.org/api/rest_v1/page/summary/${searchTerm}`
            );
            if (res.ok) {
                const data = await res.json();
                if (data.thumbnail?.source) {
                    return reply.send({ imageUrl: data.thumbnail.source });
                }
            }
            return reply.send({ imageUrl: null });
        } catch {
            return reply.send({ imageUrl: null });
        }
    });
}
