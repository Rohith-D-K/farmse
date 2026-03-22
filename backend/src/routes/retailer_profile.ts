import { FastifyInstance } from 'fastify';
import { db } from '../db/index';
import { retailerProfiles } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticate, AuthenticatedRequest, allowBuyerOnly, allowAdminOnly } from '../middleware/auth';
import { generateId } from '../utils/auth';

export async function retailerProfileRoutes(fastify: FastifyInstance) {
    // POST /api/retailer-profile - Buyer submits verification details
    fastify.post('/api/retailer-profile', { preHandler: [authenticate, allowBuyerOnly] }, async (request: AuthenticatedRequest, reply) => {
        const buyerId = request.user!.id;
        const { businessName, businessType, licenseNumber, gstNumber, address, phone } = request.body as any;

        if (!businessName || !businessType || !licenseNumber || !address || !phone) {
            return reply.code(400).send({ error: 'Missing required fields' });
        }

        if (!['grocery', 'wholesale', 'restaurant', 'other'].includes(businessType)) {
            return reply.code(400).send({ error: 'Invalid business type' });
        }

        // Check if already submitted
        const [existing] = await db.select().from(retailerProfiles).where(eq(retailerProfiles.buyerId, buyerId)).limit(1);
        if (existing) {
            // Return existing profile (allow re-use)
            return reply.send({ id: existing.id, verificationStatus: existing.verificationStatus, message: 'Existing retailer profile found' });
        }

        const id = generateId();
        await db.insert(retailerProfiles).values({
            id,
            buyerId,
            businessName,
            businessType,
            licenseNumber,
            gstNumber: gstNumber || null,
            address,
            phone,
            verificationStatus: 'pending'
        });

        return reply.send({ id, verificationStatus: 'pending', message: 'Retailer profile submitted for verification' });
    });

    // GET /api/retailer-profile/me - Buyer checks their own profile status
    fastify.get('/api/retailer-profile/me', { preHandler: [authenticate, allowBuyerOnly] }, async (request: AuthenticatedRequest, reply) => {
        const buyerId = request.user!.id;
        const [profile] = await db.select().from(retailerProfiles).where(eq(retailerProfiles.buyerId, buyerId)).limit(1);
        if (!profile) return reply.code(404).send({ error: 'No retailer profile found' });
        return reply.send(profile);
    });

    // GET /api/admin/retailer-profiles - Admin views all profiles
    fastify.get('/api/admin/retailer-profiles', { preHandler: [authenticate, allowAdminOnly] }, async (request: AuthenticatedRequest, reply) => {
        const profiles = await db.select().from(retailerProfiles);
        return reply.send(profiles);
    });

    // POST /api/admin/retailer-profiles/:id/verify - Admin verifies a profile
    fastify.post('/api/admin/retailer-profiles/:id/verify', { preHandler: [authenticate, allowAdminOnly] }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };
        const { adminNotes } = request.body as any;

        const [profile] = await db.select().from(retailerProfiles).where(eq(retailerProfiles.id, id)).limit(1);
        if (!profile) return reply.code(404).send({ error: 'Profile not found' });

        await db.update(retailerProfiles).set({ verificationStatus: 'verified', adminNotes: adminNotes || null }).where(eq(retailerProfiles.id, id));
        return reply.send({ message: 'Retailer profile verified' });
    });

    // POST /api/admin/retailer-profiles/:id/reject - Admin rejects a profile
    fastify.post('/api/admin/retailer-profiles/:id/reject', { preHandler: [authenticate, allowAdminOnly] }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };
        const { adminNotes } = request.body as any;

        const [profile] = await db.select().from(retailerProfiles).where(eq(retailerProfiles.id, id)).limit(1);
        if (!profile) return reply.code(404).send({ error: 'Profile not found' });

        await db.update(retailerProfiles).set({ verificationStatus: 'rejected', adminNotes: adminNotes || null }).where(eq(retailerProfiles.id, id));
        return reply.send({ message: 'Retailer profile rejected' });
    });

    // DELETE /api/retailer-profile/me - Buyer converts back to normal buyer (deletes retailer profile)
    fastify.delete('/api/retailer-profile/me', { preHandler: [authenticate, allowBuyerOnly] }, async (request: AuthenticatedRequest, reply) => {
        const buyerId = request.user!.id;
        await db.delete(retailerProfiles).where(eq(retailerProfiles.buyerId, buyerId));
        return reply.send({ message: 'Retailer profile deleted successfully. You are now a normal buyer.' });
    });
}
