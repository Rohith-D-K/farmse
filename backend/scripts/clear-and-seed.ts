import { db } from '../src/db/index';
import { users, products, orders, reviews, sessions } from '../src/db/schema';
import { hashPassword, generateId } from '../src/utils/auth';
import { sql } from 'drizzle-orm';

async function clearAndSeedDatabase() {
    console.log('🧹 Clearing existing data...\n');

    try {
        // Delete all data from tables (in correct order due to foreign keys)
        await db.delete(reviews);
        await db.delete(orders);
        await db.delete(products);
        await db.delete(sessions);
        await db.delete(users);

        console.log('✅ All tables cleared!\n');
        console.log('🌱 Seeding database with fresh data...\n');

        // Create farmers
        const farmer1Id = generateId();
        const farmer2Id = generateId();
        const farmer3Id = generateId();

        await db.insert(users).values([
            {
                id: farmer1Id,
                email: 'farmer1@example.com',
                passwordHash: await hashPassword('password123'),
                name: 'Rajesh Kumar',
                phone: '+91 98765 43210',
                location: 'Punjab',
                role: 'farmer',
                deliveryLocation: null
            },
            {
                id: farmer2Id,
                email: 'farmer2@example.com',
                passwordHash: await hashPassword('password123'),
                name: 'Suresh Patel',
                phone: '+91 98765 43211',
                location: 'Gujarat',
                role: 'farmer',
                deliveryLocation: null
            },
            {
                id: farmer3Id,
                email: 'farmer3@example.com',
                passwordHash: await hashPassword('password123'),
                name: 'Amit Singh',
                phone: '+91 98765 43212',
                location: 'Haryana',
                role: 'farmer',
                deliveryLocation: null
            }
        ]);

        // Create buyers
        const buyer1Id = generateId();
        const buyer2Id = generateId();

        await db.insert(users).values([
            {
                id: buyer1Id,
                email: 'buyer1@example.com',
                passwordHash: await hashPassword('password123'),
                name: 'Priya Sharma',
                phone: '+91 98765 43213',
                location: 'Delhi',
                role: 'buyer',
                deliveryLocation: 'Connaught Place, Delhi'
            },
            {
                id: buyer2Id,
                email: 'buyer2@example.com',
                passwordHash: await hashPassword('password123'),
                name: 'Rahul Verma',
                phone: '+91 98765 43214',
                location: 'Mumbai',
                role: 'buyer',
                deliveryLocation: 'Andheri, Mumbai'
            }
        ]);

        console.log('✅ Users created!');

        // Create products
        const products_data = [
            {
                id: generateId(),
                farmerId: farmer1Id,
                cropName: 'Basmati Rice',
                price: 45.5,
                quantity: 499,
                location: 'Punjab',
                image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
            },
            {
                id: generateId(),
                farmerId: farmer1Id,
                cropName: 'Wheat',
                price: 25,
                quantity: 1020,
                location: 'Punjab',
                image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400'
            },
            {
                id: generateId(),
                farmerId: farmer2Id,
                cropName: 'Cotton',
                price: 55,
                quantity: 300,
                location: 'Gujarat',
                image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400'
            },
            {
                id: generateId(),
                farmerId: farmer2Id,
                cropName: 'Peanuts',
                price: 80,
                quantity: 150,
                location: 'Gujarat',
                image: 'https://images.unsplash.com/photo-1560155477-f0a3c5c1d8d2?w=400'
            },
            {
                id: generateId(),
                farmerId: farmer3Id,
                cropName: 'Mustard',
                price: 70,
                quantity: 8,
                location: 'Haryana',
                image: 'https://images.unsplash.com/photo-1599909533730-f9d49f97f7e4?w=400'
            },
            {
                id: generateId(),
                farmerId: farmer3Id,
                cropName: 'Sugarcane',
                price: 35,
                quantity: 600,
                location: 'Haryana',
                image: 'https://images.unsplash.com/photo-1583484963886-cfe2a9a2f8d1?w=400'
            }
        ];

        await db.insert(products).values(products_data);

        console.log('✅ Products created!');
        console.log('\n📊 Database seeded successfully!');
        console.log('\n🔐 Test Credentials:');
        console.log('Farmer: farmer1@example.com / password123');
        console.log('Buyer: buyer1@example.com / password123\n');

    } catch (error: any) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
}

// Run seeding
clearAndSeedDatabase();
