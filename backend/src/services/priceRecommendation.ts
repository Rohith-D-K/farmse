import { db } from '../db/index';
import { products, users, marketPrices, cropSearches } from '../db/schema';
import { sql } from 'drizzle-orm';
import { haversineDistance } from '../utils/haversine';
import { generateId } from '../utils/auth';

// ── Types ────────────────────────────────────────────────────

interface PriceRecommendationParams {
    cropName: string;
    lat: number;
    lng: number;
    radiusKm?: number; // defaults to 50
}

interface PriceRecommendationResult {
    recommendedPrice: number | null;
    avgNearbyPrice: number | null;
    marketPrice: number | null;
    demand: number | null;
    demandLevel: 'high' | 'medium' | 'low' | 'unknown';
    nearbyListingCount: number;
    message: string;
    defaultPriceRange?: { min: number; max: number };
}

// ── Core calculation ─────────────────────────────────────────

export async function calculateRecommendedPrice(
    params: PriceRecommendationParams
): Promise<PriceRecommendationResult> {
    const { cropName, lat, lng, radiusKm = 50 } = params;

    // 1. Fetch all products matching cropName
    const matchingProducts = await db
        .select({
            price: products.price,
            farmerId: products.farmerId,
        })
        .from(products)
        .where(sql`LOWER(${products.cropName}) = LOWER(${cropName})`);

    // Get farmer locations for distance filtering
    const farmerIds = [...new Set(matchingProducts.map((p) => p.farmerId))];
    const farmers =
        farmerIds.length > 0
            ? await db
                  .select({
                      id: users.id,
                      latitude: users.latitude,
                      longitude: users.longitude,
                  })
                  .from(users)
                  .where(
                      sql`${users.id} IN (${sql.join(
                          farmerIds.map((id) => sql`${id}`),
                          sql`, `
                      )})`
                  )
            : [];

    const farmerMap = new Map(farmers.map((f) => [f.id, f]));

    // 2. Filter to products within radiusKm using Haversine
    const nearbyPrices = matchingProducts
        .filter((p) => {
            const f = farmerMap.get(p.farmerId);
            if (!f || !f.latitude || !f.longitude) return false;
            return haversineDistance(lat, lng, f.latitude, f.longitude) <= radiusKm;
        })
        .map((p) => p.price);

    // 3. Compute avgNearbyPrice
    const avgNearbyPrice =
        nearbyPrices.length > 0
            ? nearbyPrices.reduce((a, b) => a + b, 0) / nearbyPrices.length
            : null;

    // 4. Look up market price
    const [marketRow] = await db
        .select({ price: marketPrices.price })
        .from(marketPrices)
        .where(sql`LOWER(${marketPrices.cropName}) = LOWER(${cropName})`)
        .limit(1);

    const marketPrice = marketRow?.price ?? null;

    // 5. Compute demand
    const demandInfo = await getDemandInfo(cropName);

    // 6. Calculate demand-adjusted price
    const basePrice = avgNearbyPrice ?? marketPrice;
    let demandAdjustedPrice: number | null = null;
    if (basePrice !== null) {
        switch (demandInfo.level) {
            case 'high':
                demandAdjustedPrice = basePrice * 1.1;
                break;
            case 'medium':
                demandAdjustedPrice = basePrice * 1.05;
                break;
            case 'low':
                demandAdjustedPrice = basePrice * 0.95;
                break;
            default:
                demandAdjustedPrice = basePrice;
        }
    }

    // ── Edge cases ───────────────────────────────────────────

    // Case 1: No nearby listings AND no market price → default range
    if (avgNearbyPrice === null && marketPrice === null) {
        return {
            recommendedPrice: null,
            avgNearbyPrice: null,
            marketPrice: null,
            demand: demandInfo.ratio,
            demandLevel: demandInfo.level,
            nearbyListingCount: 0,
            message:
                'No nearby listings or market data found for this crop. Showing default price range.',
            defaultPriceRange: { min: 20, max: 100 },
        };
    }

    // Case 2: No nearby listings → use market price only
    if (avgNearbyPrice === null && marketPrice !== null) {
        return {
            recommendedPrice: round2(marketPrice),
            avgNearbyPrice: null,
            marketPrice: round2(marketPrice),
            demand: demandInfo.ratio,
            demandLevel: demandInfo.level,
            nearbyListingCount: 0,
            message: `No nearby listings found. Recommended price is based on market price.`,
        };
    }

    // Case 3: No market price → use nearby average
    if (avgNearbyPrice !== null && marketPrice === null) {
        const recPrice =
            demandAdjustedPrice !== null
                ? 0.7 * avgNearbyPrice + 0.3 * demandAdjustedPrice
                : avgNearbyPrice;
        return {
            recommendedPrice: round2(recPrice),
            avgNearbyPrice: round2(avgNearbyPrice),
            marketPrice: null,
            demand: demandInfo.ratio,
            demandLevel: demandInfo.level,
            nearbyListingCount: nearbyPrices.length,
            message: `Based on ${nearbyPrices.length} nearby listing(s). No market price available.`,
        };
    }

    // Case 4: All data available → weighted formula
    const recommendedPrice =
        0.5 * avgNearbyPrice! + 0.3 * marketPrice! + 0.2 * demandAdjustedPrice!;

    return {
        recommendedPrice: round2(recommendedPrice),
        avgNearbyPrice: round2(avgNearbyPrice!),
        marketPrice: round2(marketPrice!),
        demand: demandInfo.ratio,
        demandLevel: demandInfo.level,
        nearbyListingCount: nearbyPrices.length,
        message: `Based on ${nearbyPrices.length} nearby listing(s), market price, and ${demandInfo.level} demand.`,
    };
}

// ── Demand helpers ───────────────────────────────────────────

export async function getDemandInfo(cropName: string) {
    // Count searches in the last 30 days
    const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const searchResult = await db.execute(
        sql`SELECT COUNT(*) as cnt FROM crop_searches WHERE LOWER(crop_name) = LOWER(${cropName}) AND searched_at >= ${thirtyDaysAgo}`
    );
    const searchCount = Number(searchResult.rows[0]?.cnt ?? 0);

    // Count current listings
    const listingResult = await db.execute(
        sql`SELECT COUNT(*) as cnt FROM products WHERE LOWER(crop_name) = LOWER(${cropName})`
    );
    const listingCount = Number(listingResult.rows[0]?.cnt ?? 0);

    const ratio = listingCount > 0 ? searchCount / listingCount : searchCount > 0 ? searchCount : 0;

    let level: 'high' | 'medium' | 'low' | 'unknown' = 'unknown';
    if (searchCount === 0 && listingCount === 0) {
        level = 'unknown';
    } else if (ratio > 2) {
        level = 'high';
    } else if (ratio >= 1) {
        level = 'medium';
    } else {
        level = 'low';
    }

    return { searchCount, listingCount, ratio: round2(ratio), level };
}

export async function recordCropSearch(cropName: string) {
    await db.execute(
        sql`INSERT INTO crop_searches (id, crop_name) VALUES (${generateId()}, ${cropName})`
    );
}

// ── Utility ──────────────────────────────────────────────────

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}
