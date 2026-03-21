import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';

const BASE_URL = 'http://localhost:3000';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://farmse:farmse123@localhost:5432/farmse';

// Helper to make API requests
async function apiRequest(path: string, options: RequestInit = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    const body = await res.json();
    return { status: res.status, body };
}

function authHeaders(token: string) {
    return { Authorization: `Bearer ${token}` };
}

// Unique suffix to avoid colliding with existing seed data
const uid = Date.now();

// Test accounts
const farmerAccount = {
    email: `testfarmer${uid}@test.com`,
    password: 'TestPass123',
    name: 'Test Farmer',
    phone: '9876500001',
    location: 'Test Farm, Coimbatore',
    role: 'farmer' as const,
    latitude: 11.0168,
    longitude: 76.9558,
};

const buyerAccount = {
    email: `testbuyer${uid}@test.com`,
    password: 'TestPass123',
    name: 'Test Buyer',
    phone: '9876500002',
    location: 'RS Puram, Coimbatore',
    role: 'buyer' as const,
    latitude: 11.0108,   // ~1 km from farmer — within 10 km
    longitude: 76.9520,
};

const farBuyerAccount = {
    email: `farbuyer${uid}@test.com`,
    password: 'TestPass123',
    name: 'Far Buyer',
    phone: '9876500003',
    location: 'Chennai',
    role: 'buyer' as const,
    latitude: 13.0827,   // ~500 km from farmer — well beyond 10 km
    longitude: 80.2707,
};

let farmerToken = '';
let buyerToken = '';
let farBuyerToken = '';
let farmerId = '';
let buyerId = '';
let productId = '';
let orderId = '';

// ────────────────────────── Health ──────────────────────────
describe('Health', () => {
    it('GET /health returns ok', async () => {
        const { status, body } = await apiRequest('/health');
        expect(status).toBe(200);
        expect(body.status).toBe('ok');
    });
});

// ────────────────────────── Auth ──────────────────────────
describe('Auth', () => {
    it('registers a farmer', async () => {
        const { status, body } = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(farmerAccount),
        });
        expect(status).toBe(200);
        expect(body.user.role).toBe('farmer');
        expect(body.sessionToken).toBeTruthy();
        farmerToken = body.sessionToken;
        farmerId = body.user.id;
    });

    it('registers a nearby buyer', async () => {
        const { status, body } = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(buyerAccount),
        });
        expect(status).toBe(200);
        expect(body.user.role).toBe('buyer');
        buyerToken = body.sessionToken;
        buyerId = body.user.id;
    });

    it('registers a far-away buyer', async () => {
        const { status, body } = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(farBuyerAccount),
        });
        expect(status).toBe(200);
        farBuyerToken = body.sessionToken;
    });

    it('rejects duplicate email', async () => {
        const { status } = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(farmerAccount),
        });
        expect(status).toBe(400);
    });

    it('logs in with correct credentials', async () => {
        const { status, body } = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: farmerAccount.email,
                password: farmerAccount.password,
            }),
        });
        expect(status).toBe(200);
        expect(body.sessionToken).toBeTruthy();
    });

    it('rejects wrong password', async () => {
        const { status } = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: farmerAccount.email,
                password: 'wrong',
            }),
        });
        expect(status).toBe(401);
    });

    it('GET /api/auth/me returns current user', async () => {
        const { status, body } = await apiRequest('/api/auth/me', {
            headers: authHeaders(farmerToken),
        });
        expect(status).toBe(200);
        expect(body.user.email).toBe(farmerAccount.email);
    });

    it('rejects unauthenticated /api/auth/me', async () => {
        const { status } = await apiRequest('/api/auth/me');
        expect(status).toBe(401);
    });
});

// ────────────────────────── Products ──────────────────────────
describe('Products', () => {
    it('farmer can create a product', async () => {
        const { status, body } = await apiRequest('/api/products', {
            method: 'POST',
            headers: authHeaders(farmerToken),
            body: JSON.stringify({
                cropName: 'Tomato',
                price: 40,
                quantity: 50,
                location: farmerAccount.location,
                image: '/produce/tomato.jpg',
            }),
        });
        expect(status).toBe(200);
        expect(body.id).toBeTruthy();
        expect(body.cropName).toBe('Tomato');
        productId = body.id;
    });

    it('buyer cannot create a product', async () => {
        const { status } = await apiRequest('/api/products', {
            method: 'POST',
            headers: authHeaders(buyerToken),
            body: JSON.stringify({
                cropName: 'Spinach',
                price: 30,
                quantity: 10,
                location: buyerAccount.location,
                image: '/produce/spinach.jpg',
            }),
        });
        expect(status).toBe(403);
    });

    it('nearby buyer sees the product (within 10 km)', async () => {
        const { status, body } = await apiRequest('/api/products', {
            headers: authHeaders(buyerToken),
        });
        expect(status).toBe(200);
        const found = body.find((p: any) => p.id === productId);
        expect(found).toBeTruthy();
    });

    it('far-away buyer does NOT see the product (beyond 10 km)', async () => {
        const { status, body } = await apiRequest('/api/products', {
            headers: authHeaders(farBuyerToken),
        });
        expect(status).toBe(200);
        const found = body.find((p: any) => p.id === productId);
        expect(found).toBeUndefined();
    });

    it('unauthenticated request returns all products', async () => {
        const { status, body } = await apiRequest('/api/products');
        expect(status).toBe(200);
        expect(Array.isArray(body)).toBe(true);
    });

    it('GET /api/products/:id returns single product', async () => {
        const { status, body } = await apiRequest(`/api/products/${productId}`);
        expect(status).toBe(200);
        expect(body.cropName).toBe('Tomato');
    });

    it('farmer can update their product', async () => {
        const { status, body } = await apiRequest(`/api/products/${productId}`, {
            method: 'PUT',
            headers: authHeaders(farmerToken),
            body: JSON.stringify({
                cropName: 'Tomato',
                price: 45,
                quantity: 40,
                location: farmerAccount.location,
                image: '/produce/tomato.jpg',
            }),
        });
        expect(status).toBe(200);
        expect(body.price).toBe(45);
    });

    it('suggest-price endpoint works', async () => {
        const { status, body } = await apiRequest(
            '/api/products/suggest-price?cropName=Tomato',
            { headers: authHeaders(farmerToken) }
        );
        expect(status).toBe(200);
        expect(body).toHaveProperty('suggestedPrice');
    });

    it('crop-image endpoint returns a URL or null', async () => {
        const { status, body } = await apiRequest(
            '/api/products/crop-image?name=Tomato',
            { headers: authHeaders(farmerToken) }
        );
        expect(status).toBe(200);
        expect(body).toHaveProperty('imageUrl');
    });
});

// ────────────────────────── Orders ──────────────────────────
describe('Orders', () => {
    it('buyer can place an order', async () => {
        const { status, body } = await apiRequest('/api/orders', {
            method: 'POST',
            headers: authHeaders(buyerToken),
            body: JSON.stringify({
                productId,
                quantity: 5,
                deliveryMethod: 'buyer_pickup',
                paymentMethod: 'cash_on_delivery',
            }),
        });
        expect(status).toBe(200);
        expect(body.id).toBeTruthy();
        orderId = body.id;
    });

    it('buyer sees their orders', async () => {
        const { status, body } = await apiRequest('/api/orders', {
            headers: authHeaders(buyerToken),
        });
        expect(status).toBe(200);
        expect(body.length).toBeGreaterThanOrEqual(1);
    });

    it('farmer sees incoming orders', async () => {
        const { status, body } = await apiRequest('/api/orders', {
            headers: authHeaders(farmerToken),
        });
        expect(status).toBe(200);
        expect(body.length).toBeGreaterThanOrEqual(1);
    });

    it('farmer can accept the order', async () => {
        const { status, body } = await apiRequest(`/api/orders/${orderId}/accept`, {
            method: 'PUT',
            headers: authHeaders(farmerToken),
            body: JSON.stringify({}),
        });
        if (status !== 200) console.log('Accept order error:', body);
        expect(status).toBe(200);
        expect(body.orderStatus).toBe('accepted');
    });
});

// ────────────────────────── Reviews ──────────────────────────
describe('Reviews', () => {
    // Mark the order as delivered so review is allowed
    beforeAll(async () => {
        const r = await apiRequest(`/api/orders/${orderId}/deliver`, {
            method: 'PUT',
            headers: authHeaders(farmerToken),
            body: JSON.stringify({}),
        });
        if (r.status !== 200) console.log('Deliver order error:', r.body);
    });

    it('buyer can leave a review (order must be delivered)', async () => {
        const { status, body } = await apiRequest('/api/reviews', {
            method: 'POST',
            headers: authHeaders(buyerToken),
            body: JSON.stringify({
                orderId,
                productId,
                rating: 5,
                comment: 'Great tomatoes!',
            }),
        });
        if (status !== 200) console.log('Review error:', body);
        expect(status).toBe(200);
        expect(body.rating).toBe(5);
    });

    it('product reviews are accessible', async () => {
        const { status, body } = await apiRequest(`/api/reviews/product/${productId}`);
        expect(status).toBe(200);
        expect(body.length).toBeGreaterThanOrEqual(1);
    });
});

// ────────────────────────── Chats ──────────────────────────
describe('Chats', () => {
    let chatId = '';

    it('buyer can start a chat', async () => {
        const { status, body } = await apiRequest('/api/chats/start', {
            method: 'POST',
            headers: authHeaders(buyerToken),
            body: JSON.stringify({
                productId,
                farmerId,
            }),
        });
        expect(status).toBe(200);
        expect(body.id).toBeTruthy();
        chatId = body.id;
    });

    it('buyer can send a message', async () => {
        const { status, body } = await apiRequest(`/api/chats/${chatId}/message`, {
            method: 'POST',
            headers: authHeaders(buyerToken),
            body: JSON.stringify({ text: 'Hello farmer!' }),
        });
        expect(status).toBe(200);
        expect(body.text).toBe('Hello farmer!');
    });

    it('messages can be retrieved', async () => {
        const { status, body } = await apiRequest(`/api/chats/${chatId}/messages`, {
            headers: authHeaders(buyerToken),
        });
        expect(status).toBe(200);
        expect(body.length).toBeGreaterThanOrEqual(1);
    });

    it('user chats list works', async () => {
        const { status, body } = await apiRequest(`/api/chats/user/${buyerId}`, {
            headers: authHeaders(buyerToken),
        });
        expect(status).toBe(200);
        expect(body.length).toBeGreaterThanOrEqual(1);
    });
});

// ────────────────────────── Price Recommendation ──────────────────────────
describe('Price Recommendation', () => {
    it('returns default price range for unknown crop', async () => {
        const { status, body } = await apiRequest(
            '/api/price/recommend?cropName=UnknownCrop123&lat=11.0168&lng=76.9558'
        );
        expect(status).toBe(200);
        expect(body.recommendedPrice).toBeNull();
        expect(body.defaultPriceRange).toBeTruthy();
        expect(body.defaultPriceRange.min).toBeTypeOf('number');
        expect(body.defaultPriceRange.max).toBeTypeOf('number');
    });

    it('returns market price fallback for crop with no listings', async () => {
        const { status, body } = await apiRequest(
            '/api/price/recommend?cropName=Rice&lat=11.0168&lng=76.9558'
        );
        expect(status).toBe(200);
        expect(body.recommendedPrice).toBeTypeOf('number');
        expect(body.marketPrice).toBeTypeOf('number');
        expect(body.avgNearbyPrice).toBeNull();
        expect(body.nearbyListingCount).toBe(0);
    });

    it('tracks a crop search', async () => {
        const { status, body } = await apiRequest('/api/price/search-track', {
            method: 'POST',
            body: JSON.stringify({ cropName: 'Tomato' }),
        });
        expect(status).toBe(200);
        expect(body.ok).toBe(true);
    });

    it('tracks multiple searches to raise demand', async () => {
        // Add several searches to push demand higher
        for (let i = 0; i < 4; i++) {
            await apiRequest('/api/price/search-track', {
                method: 'POST',
                body: JSON.stringify({ cropName: 'Tomato' }),
            });
        }
        const { status, body } = await apiRequest('/api/price/search-track', {
            method: 'POST',
            body: JSON.stringify({ cropName: 'Tomato' }),
        });
        expect(status).toBe(200);
        expect(body.ok).toBe(true);
    });

    it('returns recommendation for Tomato with nearby listings', async () => {
        // The farmer created a Tomato product earlier in the Products test suite
        const { status, body } = await apiRequest(
            `/api/price/recommend?cropName=Tomato&lat=${farmerAccount.latitude}&lng=${farmerAccount.longitude}`
        );
        expect(status).toBe(200);
        expect(body.recommendedPrice).toBeTypeOf('number');
        expect(body.avgNearbyPrice).toBeTypeOf('number');
        expect(body.marketPrice).toBeTypeOf('number');
        expect(body.nearbyListingCount).toBeGreaterThanOrEqual(1);
        expect(body.demand).toBeTypeOf('number');
        expect(['high', 'medium', 'low', 'unknown']).toContain(body.demandLevel);
        expect(body.message).toBeTruthy();
    });

    it('rejects missing query params', async () => {
        const { status } = await apiRequest('/api/price/recommend?cropName=Tomato');
        expect(status).toBe(400);
    });

    it('rejects invalid coordinates', async () => {
        const { status } = await apiRequest(
            '/api/price/recommend?cropName=Tomato&lat=abc&lng=def'
        );
        expect(status).toBe(400);
    });

    it('rejects empty cropName for search-track', async () => {
        const { status } = await apiRequest('/api/price/search-track', {
            method: 'POST',
            body: JSON.stringify({ cropName: '' }),
        });
        expect(status).toBe(400);
    });
});

// ────────────────────────── Cleanup ──────────────────────────
describe('Cleanup', () => {
    it('test data was created successfully', () => {
        expect(productId).toBeTruthy();
        expect(orderId).toBeTruthy();
    });
});

// Clean up all test data from the database after all tests complete
afterAll(async () => {
    const pool = new pg.Pool({ connectionString: DATABASE_URL });
    const emails = [farmerAccount.email, buyerAccount.email, farBuyerAccount.email];
    const p = emails.map((_, i) => `$${i + 1}`).join(', ');

    try {
        const userIds = `SELECT id FROM users WHERE email IN (${p})`;
        await pool.query(`DELETE FROM messages WHERE chat_id IN (SELECT id FROM chats WHERE buyer_id IN (${userIds}) OR farmer_id IN (${userIds}))`, emails);
        await pool.query(`DELETE FROM chats WHERE buyer_id IN (${userIds}) OR farmer_id IN (${userIds})`, emails);
        await pool.query(`DELETE FROM reviews WHERE buyer_id IN (${userIds})`, emails);
        await pool.query(`DELETE FROM orders WHERE buyer_id IN (${userIds}) OR farmer_id IN (${userIds})`, emails);
        await pool.query(`DELETE FROM products WHERE farmer_id IN (${userIds})`, emails);
        await pool.query(`DELETE FROM sessions WHERE user_id IN (${userIds})`, emails);
        await pool.query(`DELETE FROM users WHERE email IN (${p})`, emails);
        // Clean up test search tracking data
        await pool.query(`DELETE FROM crop_searches WHERE LOWER(crop_name) = 'tomato'`);
    } finally {
        await pool.end();
    }
});
