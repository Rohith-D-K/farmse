import { FastifyInstance } from 'fastify';
import { db } from '../db/index';
import { products, users } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { generateId } from '../utils/auth';

export async function productRoutes(fastify: FastifyInstance) {
    // Get all products
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

            return reply.send(allProducts);
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
}
