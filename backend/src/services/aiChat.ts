import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../db/index';
import { products, users, harvests, marketPrices, cropSearches } from '../db/schema';
import { sql, eq, and, gt } from 'drizzle-orm';
import { calculateRecommendedPrice, getDemandInfo } from './priceRecommendation';

// Initialize Gemini lazily
let genAI: GoogleGenerativeAI | null = null;

function getGenAI() {
    if (!genAI) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    }
    return genAI;
}

export async function getAiResponse(userMessage: string, lang: string, role: string, userLocation?: { lat: number; lng: number }) {
    try {
        const client = getGenAI();
        // 1. Fetch RAG Context
        const contextData = await fetchMarketplaceContext(userMessage, userLocation);

        // 2. Construct System Prompt
        const systemPrompt = `You are an AI assistant for Farmse, a smart agriculture marketplace that connects farmers and buyers directly.

Farmse features include:
- Farmers can list crops
- Buyers can purchase crops
- Harvest preorder system: Farmers list upcoming harvests (future crops). Buyers can book them in advance.
- Community buying: Bulk preorders trigger discounts (5%, 10%, 15%) for everyone.
- AI-based price recommendation: Uses nearby listings, market prices, and demand.
- Location-based product discovery.
- Order tracking and delivery.
- Ratings and reviews.

CURRENT MARKETPLACE DATA (RAG Context):
${contextData}

USER INFO:
- Role: ${role}
- Language: ${lang}
${userLocation ? `- Location: Latitude ${userLocation.lat}, Longitude ${userLocation.lng}` : ''}

YOUR JOB:
- Help farmers decide what price to set using the data provided.
- Help buyers find crops or explain where to find them.
- Explain how preorder and community buying works simply.
- Provide general farming advice if asked.
- Answer in simple language.
- ALWAYS respond in the user's language (${lang}).
- Keep responses concise (max 3-4 short paragraphs).
- Suggest 2-3 follow-up questions at the end in square brackets, e.g. [How to preorder?], [Current tomato price?].`;

        // 3. Call Gemini
        const model = client.getGenerativeModel({ model: "gemini-flash-latest" });
        
        const result = await model.generateContent([
            systemPrompt,
            `User Question: ${userMessage}`
        ]);
        
        const responseText = result.response.text();

        // 4. Parse suggestions
        const suggestions: string[] = [];
        const suggestionMatch = responseText.match(/\[(.*?)\]/g);
        let cleanedResponse = responseText;
        
        if (suggestionMatch) {
            suggestionMatch.forEach(s => {
                suggestions.push(s.slice(1, -1));
                cleanedResponse = cleanedResponse.replace(s, '');
            });
        }

        // Clean up trailing commas or newlines left by suggestion removal
        cleanedResponse = cleanedResponse.replace(/[,.\s]*$/, '').trim();

        return {
            response: cleanedResponse,
            suggestions: suggestions.slice(0, 3)
        };

    } catch (error: any) {
        console.error('Gemini API Error:', error);
        throw new Error('Failed to get AI response');
    }
}

async function fetchMarketplaceContext(message: string, location?: { lat: number; lng: number }) {
    let context = "";

    // Extract potential crop names from message (very basic)
    const commonCrops = ['tomato', 'onion', 'potato', 'rice', 'wheat', 'mango', 'banana', 'carrot', 'spinach', 'cauliflower', 'cabbage', 'brinjal'];
    const mentionedCrops = commonCrops.filter(crop => message.toLowerCase().includes(crop));

    // A. Nearby Prices & Demand
    if (mentionedCrops.length > 0 && location) {
        context += "\n--- PRICE & DEMAND INFO ---\n";
        for (const crop of mentionedCrops) {
            try {
                const priceData = await calculateRecommendedPrice({ cropName: crop, lat: location.lat, lng: location.lng });
                context += `- ${crop.toUpperCase()}: Recommended ₹${priceData.recommendedPrice}/kg. Market Price: ₹${priceData.marketPrice}/kg. Demand: ${priceData.demandLevel}.\n`;
            } catch (err) {
                // skip if error
            }
        }
    }

    // B. Available Products (Recent 5)
    const availableProducts = await db.select().from(products).limit(5).orderBy(sql`${products.createdAt} DESC`);
    if (availableProducts.length > 0) {
        context += "\n--- AVAILABLE PRODUCTS ---\n";
        availableProducts.forEach(p => {
            context += `- ${p.cropName}: ₹${p.price}/kg at ${p.location}\n`;
        });
    }

    // C. Upcoming Harvests (Recent 5)
    const upcomingHarvests = await db.select().from(harvests).where(eq(harvests.status, 'open')).limit(5).orderBy(sql`${harvests.createdAt} DESC`);
    if (upcomingHarvests.length > 0) {
        context += "\n--- UPCOMING HARVESTS ---\n";
        upcomingHarvests.forEach(h => {
            const date = h.expectedHarvestDate;
            context += `- ${h.cropName}: Expected ${date}. Base Price: ₹${h.basePricePerKg}/kg. (Location: ${h.location})\n`;
        });
    }

    return context || "No specific marketplace data found for this query.";
}
