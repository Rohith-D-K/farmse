import { db } from '../db/index';
import { products, users, marketPrices, cropSearches } from '../db/schema';
import { sql } from 'drizzle-orm';
import { haversineDistance } from '../utils/haversine';
import { generateId } from '../utils/auth';

// ══════════════════════════════════════════════════════════════
//  Weighted Linear Regression Pricing Model
//
//  price = w1 × (nearby price)
//        + w2 × (govt / market price)
//        + w3 × (demand-adjusted price)
//        + w4 × (season-adjusted price)
//
//  Weights: w1=0.40, w2=0.25, w3=0.20, w4=0.15
//  These can be tuned over time with real transaction data.
// ══════════════════════════════════════════════════════════════

// ── Model weights ────────────────────────────────────────────
const W1_NEARBY  = 0.40; // nearby listing average
const W2_MARKET  = 0.25; // government / market price
const W3_DEMAND  = 0.20; // demand factor
const W4_SEASON  = 0.15; // season factor

// ── Season configuration ─────────────────────────────────────
// Maps crop → peak months and off-season months (1-indexed)
// During peak harvest → supply is high → prices dip (factor < 1)
// During off-season   → supply is low  → prices rise (factor > 1)
const CROP_SEASONS: Record<string, { peak: number[]; off: number[] }> = {
    tomato:      { peak: [12, 1, 2, 3],     off: [6, 7, 8] },
    onion:       { peak: [11, 12, 1],        off: [5, 6, 7, 8] },
    potato:      { peak: [1, 2, 3],          off: [7, 8, 9] },
    rice:        { peak: [10, 11, 12],       off: [4, 5, 6] },
    wheat:       { peak: [3, 4, 5],          off: [9, 10, 11] },
    mango:       { peak: [5, 6, 7],          off: [11, 12, 1, 2] },
    banana:      { peak: [3, 4, 5, 10, 11],  off: [7, 8] },
    carrot:      { peak: [11, 12, 1, 2],     off: [5, 6, 7] },
    spinach:     { peak: [11, 12, 1, 2],     off: [5, 6, 7] },
    cauliflower: { peak: [11, 12, 1],        off: [5, 6, 7, 8] },
    cabbage:     { peak: [11, 12, 1, 2],     off: [5, 6, 7] },
    brinjal:     { peak: [10, 11, 12],       off: [4, 5, 6] },
};

const SEASON_FACTOR_PEAK = 0.90;      // harvest glut → price drops
const SEASON_FACTOR_OFF  = 1.15;      // scarce supply → price rises
const SEASON_FACTOR_NORMAL = 1.00;

// ── Types ────────────────────────────────────────────────────

interface PriceRecommendationParams {
    cropName: string;
    lat: number;
    lng: number;
    radiusKm?: number; // defaults to 50
}

export interface PriceRecommendationResult {
    recommendedPrice: number | null;
    avgNearbyPrice: number | null;
    marketPrice: number | null;
    demand: number | null;
    demandLevel: 'high' | 'medium' | 'low' | 'unknown';
    seasonFactor: number;
    seasonLabel: 'peak' | 'off-season' | 'normal';
    nearbyListingCount: number;
    message: string;
    modelWeights: { w1: number; w2: number; w3: number; w4: number };
    defaultPriceRange?: { min: number; max: number };
}

// ── Season helpers ───────────────────────────────────────────

export function getSeasonInfo(cropName: string, month?: number): { factor: number; label: 'peak' | 'off-season' | 'normal' } {
    const currentMonth = month ?? new Date().getMonth() + 1; // 1-indexed
    const key = cropName.trim().toLowerCase();
    const season = CROP_SEASONS[key];

    if (!season) {
        return { factor: SEASON_FACTOR_NORMAL, label: 'normal' };
    }

    if (season.peak.includes(currentMonth)) {
        return { factor: SEASON_FACTOR_PEAK, label: 'peak' };
    }
    if (season.off.includes(currentMonth)) {
        return { factor: SEASON_FACTOR_OFF, label: 'off-season' };
    }
    return { factor: SEASON_FACTOR_NORMAL, label: 'normal' };
}

// ── Core ML calculation ──────────────────────────────────────

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

    // 4. Look up market / government price
    const [marketRow] = await db
        .select({ price: marketPrices.price })
        .from(marketPrices)
        .where(sql`LOWER(${marketPrices.cropName}) = LOWER(${cropName})`)
        .limit(1);

    const marketPrice = marketRow?.price ?? null;

    // 5. Compute demand
    const demandInfo = await getDemandInfo(cropName);

    // 6. Compute season factor
    const seasonInfo = getSeasonInfo(cropName);

    // 7. Determine the base price (best available reference)
    const basePrice = avgNearbyPrice ?? marketPrice;

    // ── Edge case: no data at all ────────────────────────────
    if (basePrice === null) {
        return {
            recommendedPrice: null,
            avgNearbyPrice: null,
            marketPrice: null,
            demand: demandInfo.ratio,
            demandLevel: demandInfo.level,
            seasonFactor: seasonInfo.factor,
            seasonLabel: seasonInfo.label,
            nearbyListingCount: 0,
            message: 'No nearby listings or market data found. Showing default price range.',
            modelWeights: { w1: W1_NEARBY, w2: W2_MARKET, w3: W3_DEMAND, w4: W4_SEASON },
            defaultPriceRange: { min: 20, max: 100 },
        };
    }

    // ── Compute each factor price ────────────────────────────
    const nearbyComponent  = avgNearbyPrice ?? basePrice;
    const marketComponent  = marketPrice ?? basePrice;

    // Demand-adjusted price
    let demandMultiplier = 1.0;
    if (demandInfo.level === 'high')   demandMultiplier = 1.10;
    if (demandInfo.level === 'medium') demandMultiplier = 1.05;
    if (demandInfo.level === 'low')    demandMultiplier = 0.95;
    const demandComponent = basePrice * demandMultiplier;

    // Season-adjusted price
    const seasonComponent = basePrice * seasonInfo.factor;

    // ── Weighted Linear Regression formula ───────────────────
    const recommendedPrice =
        W1_NEARBY * nearbyComponent +
        W2_MARKET * marketComponent +
        W3_DEMAND * demandComponent +
        W4_SEASON * seasonComponent;

    // Build descriptive message
    const parts: string[] = [];
    if (avgNearbyPrice !== null) parts.push(`${nearbyPrices.length} nearby listing(s)`);
    if (marketPrice !== null)    parts.push('market price');
    parts.push(`${demandInfo.level} demand`);
    parts.push(`${seasonInfo.label} season (×${seasonInfo.factor})`);

    return {
        recommendedPrice: round2(recommendedPrice),
        avgNearbyPrice: avgNearbyPrice !== null ? round2(avgNearbyPrice) : null,
        marketPrice: marketPrice !== null ? round2(marketPrice) : null,
        demand: demandInfo.ratio,
        demandLevel: demandInfo.level,
        seasonFactor: seasonInfo.factor,
        seasonLabel: seasonInfo.label,
        nearbyListingCount: nearbyPrices.length,
        message: `Weighted Linear Regression model using ${parts.join(', ')}.`,
        modelWeights: { w1: W1_NEARBY, w2: W2_MARKET, w3: W3_DEMAND, w4: W4_SEASON },
    };
}

// ── Demand helpers ───────────────────────────────────────────

export async function getDemandInfo(cropName: string) {
    const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const searchResult = await db.execute(
        sql`SELECT COUNT(*) as cnt FROM crop_searches WHERE LOWER(crop_name) = LOWER(${cropName}) AND searched_at >= ${thirtyDaysAgo}`
    );
    const searchCount = Number(searchResult.rows[0]?.cnt ?? 0);

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
