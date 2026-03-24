import { db, pool } from '../src/db/index';
import { cropSearches, products } from '../src/db/schema';
import { generateId } from '../src/utils/auth';
import { sql } from 'drizzle-orm';

async function seedDynamicPricing() {
    console.log('📈 Seeding data for Dynamic Pricing...');
    try {
        await db.delete(cropSearches);
        const searchEntries = [];
        
        // High Demand: Tomato (needs > 2x listings)
        for(let i = 0; i < 20; i++) {
            searchEntries.push({ id: generateId(), cropName: 'Tomato' });
        }
        // Medium Demand: Potato (needs 1x-2x listings)
        for(let i = 0; i < 5; i++) {
            searchEntries.push({ id: generateId(), cropName: 'Potato' });
        }
        // High Demand: Banana
        for(let i = 0; i < 15; i++) {
            searchEntries.push({ id: generateId(), cropName: 'Banana' });
        }
        
        await db.insert(cropSearches).values(searchEntries);
        console.log(`✅ Inserted ${searchEntries.length} searches to simulate crop demand calculations!`);
    } catch (e) {
        console.error('Failed to seed dynamic pricing:', e);
    } finally {
        await pool.end();
    }
}
seedDynamicPricing();
