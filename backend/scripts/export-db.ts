import { db, pool } from '../src/db/index';
import { users, products, orders, reviews, sessions, helpReports, chats, messages } from '../src/db/schema';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportDatabase() {
    console.log('📤 Exporting database data...\n');

    try {
        const exportData: any = {};

        // Fetch all data from each table
        console.log('Fetching users...');
        exportData.users = await db.select().from(users);

        console.log('Fetching products...');
        exportData.products = await db.select().from(products);

        console.log('Fetching orders...');
        exportData.orders = await db.select().from(orders);

        console.log('Fetching reviews...');
        exportData.reviews = await db.select().from(reviews);

        console.log('Fetching sessions...');
        exportData.sessions = await db.select().from(sessions);

        console.log('Fetching help reports...');
        exportData.helpReports = await db.select().from(helpReports);

        console.log('Fetching chats...');
        exportData.chats = await db.select().from(chats);

        console.log('Fetching messages...');
        exportData.messages = await db.select().from(messages);

        // Generate the seed file content
        const seedContent = `import { db } from '../src/db/index';
import { users, products, orders, reviews, sessions, helpReports, chats, messages } from '../src/db/schema';

async function seedFromExport() {
    console.log('🌱 Seeding database from exported data...\n');

    try {
        // Clear existing data first (in correct order due to foreign keys)
        console.log('🧹 Clearing existing data...');
        await db.delete(messages);
        await db.delete(reviews);
        await db.delete(helpReports);
        await db.delete(orders);
        await db.delete(chats);
        await db.delete(products);
        await db.delete(sessions);
        await db.delete(users);

        console.log('✅ Tables cleared!\\n');

        // Insert exported data
        if (Object.keys(${JSON.stringify(exportData.users)}).length > 0) {
            console.log('👤 Inserting users...');
            await db.insert(users).values(${JSON.stringify(exportData.users, null, 2)});
        }

        if (Object.keys(${JSON.stringify(exportData.products)}).length > 0) {
            console.log('🌾 Inserting products...');
            await db.insert(products).values(${JSON.stringify(exportData.products, null, 2)});
        }

        if (Object.keys(${JSON.stringify(exportData.orders)}).length > 0) {
            console.log('📦 Inserting orders...');
            await db.insert(orders).values(${JSON.stringify(exportData.orders, null, 2)});
        }

        if (Object.keys(${JSON.stringify(exportData.reviews)}).length > 0) {
            console.log('⭐ Inserting reviews...');
            await db.insert(reviews).values(${JSON.stringify(exportData.reviews, null, 2)});
        }

        if (Object.keys(${JSON.stringify(exportData.sessions)}).length > 0) {
            console.log('🔐 Inserting sessions...');
            await db.insert(sessions).values(${JSON.stringify(exportData.sessions, null, 2)});
        }

        if (Object.keys(${JSON.stringify(exportData.helpReports)}).length > 0) {
            console.log('📋 Inserting help reports...');
            await db.insert(helpReports).values(${JSON.stringify(exportData.helpReports, null, 2)});
        }

        if (Object.keys(${JSON.stringify(exportData.chats)}).length > 0) {
            console.log('💬 Inserting chats...');
            await db.insert(chats).values(${JSON.stringify(exportData.chats, null, 2)});
        }

        if (Object.keys(${JSON.stringify(exportData.messages)}).length > 0) {
            console.log('✉️ Inserting messages...');
            await db.insert(messages).values(${JSON.stringify(exportData.messages, null, 2)});
        }

        console.log('\\n✅ Database seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        process.exit(0);
    }
}

seedFromExport();
`;

        // Write to file
        const outputPath = path.join(__dirname, 'exported-seed.ts');
        fs.writeFileSync(outputPath, seedContent);

        console.log(`\n✅ Export complete!`);
        console.log(`📝 Created: ${outputPath}`);
        console.log(`\n📊 Exported:`);
        console.log(`   - ${exportData.users.length} users`);
        console.log(`   - ${exportData.products.length} products`);
        console.log(`   - ${exportData.orders.length} orders`);
        console.log(`   - ${exportData.reviews.length} reviews`);
        console.log(`   - ${exportData.sessions.length} sessions`);
        console.log(`   - ${exportData.helpReports.length} help reports`);
        console.log(`   - ${exportData.chats.length} chats`);
        console.log(`   - ${exportData.messages.length} messages`);

        console.log(`\n🚀 Your friend can now run: npm run seed:exported`);
    } catch (error) {
        console.error('❌ Error exporting database:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

exportDatabase();
