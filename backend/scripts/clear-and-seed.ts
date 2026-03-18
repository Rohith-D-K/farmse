import { db, pool } from '../src/db/index';
import { users, products, orders, reviews, sessions, helpReports } from '../src/db/schema';
import { hashPassword, generateId } from '../src/utils/auth';

async function clearAndSeedDatabase() {
    console.log('🧹 Clearing existing data...\n');

    try {
        // Delete all data from tables (in correct order due to foreign keys)
        await db.delete(reviews);
        await db.delete(helpReports);
        await db.delete(orders);
        await db.delete(products);
        await db.delete(sessions);
        await db.delete(users);

        console.log('✅ All tables cleared!\n');
        console.log('🌱 Seeding database with fresh data...\n');

        const defaultPasswordHash = await hashPassword('password123');

        // Create farmers and buyers
        const farmer1Id = generateId();
        const farmer2Id = generateId();
        const farmer3Id = generateId();
        const farmer4Id = generateId();
        const buyer1Id = generateId();
        const buyer2Id = generateId();
        const buyer3Id = generateId();
        const adminId = generateId();

        await db.insert(users).values([
            {
                id: farmer1Id,
                email: 'farmer1@example.com',
                passwordHash: defaultPasswordHash,
                name: 'Rajesh Kumar',
                phone: '+91 98765 43210',
                location: 'Ludhiana, Punjab',
                role: 'farmer',
                deliveryLocation: null,
                latitude: 30.901,
                longitude: 75.8573
            },
            {
                id: farmer2Id,
                email: 'farmer2@example.com',
                passwordHash: defaultPasswordHash,
                name: 'Suresh Patel',
                phone: '+91 98765 43211',
                location: 'Anand, Gujarat',
                role: 'farmer',
                deliveryLocation: null,
                latitude: 22.5645,
                longitude: 72.9289
            },
            {
                id: farmer3Id,
                email: 'farmer3@example.com',
                passwordHash: defaultPasswordHash,
                name: 'Amit Singh',
                phone: '+91 98765 43212',
                location: 'Karnal, Haryana',
                role: 'farmer',
                deliveryLocation: null,
                latitude: 29.6857,
                longitude: 76.9905
            },
            {
                id: farmer4Id,
                email: 'farmer4@example.com',
                passwordHash: defaultPasswordHash,
                name: 'Neelima Reddy',
                phone: '+91 98765 43215',
                location: 'Mysuru, Karnataka',
                role: 'farmer',
                deliveryLocation: null,
                latitude: 12.2958,
                longitude: 76.6394
            },
            {
                id: buyer1Id,
                email: 'buyer1@example.com',
                passwordHash: defaultPasswordHash,
                name: 'Priya Sharma',
                phone: '+91 98765 43213',
                location: 'New Delhi',
                role: 'buyer',
                deliveryLocation: 'Connaught Place, New Delhi',
                latitude: 28.6315,
                longitude: 77.2167
            },
            {
                id: buyer2Id,
                email: 'buyer2@example.com',
                passwordHash: defaultPasswordHash,
                name: 'Rahul Verma',
                phone: '+91 98765 43214',
                location: 'Mumbai',
                role: 'buyer',
                deliveryLocation: 'Andheri East, Mumbai',
                latitude: 19.1136,
                longitude: 72.8697
            },
            {
                id: buyer3Id,
                email: 'buyer3@example.com',
                passwordHash: defaultPasswordHash,
                name: 'Kavya Nair',
                phone: '+91 98765 43216',
                location: 'Bengaluru',
                role: 'buyer',
                deliveryLocation: 'Indiranagar, Bengaluru',
                latitude: 12.9716,
                longitude: 77.5946
            },
            {
                id: adminId,
                email: 'admin@farmse.local',
                passwordHash: defaultPasswordHash,
                name: 'FarmSe Admin',
                phone: '+91 90000 00000',
                location: 'HQ',
                role: 'admin',
                isActive: true,
                deliveryLocation: null,
                latitude: null,
                longitude: null
            }
        ]);

        console.log('✅ Users created!');

        // Create products (fruits + vegetables from mini folder)
        const tomatoId = generateId();
        const spinachId = generateId();
        const carrotId = generateId();
        const okraId = generateId();
        const cucumberId = generateId();
        const potatoId = generateId();
        const cauliflowerId = generateId();
        const cabbageId = generateId();
        const chilliId = generateId();
        const brinjalId = generateId();
        const beansId = generateId();
        const beetrootId = generateId();
        const appleId = generateId();
        const bananaId = generateId();
        const orangeId = generateId();
        const grapesId = generateId();
        const greenGrapesId = generateId();
        const strawberryId = generateId();
        const watermelonId = generateId();
        const mosambiId = generateId();
        const lemonId = generateId();

        await db.insert(products).values([
            {
                id: cauliflowerId,
                farmerId: farmer1Id,
                cropName: 'Cauliflower',
                price: 38,
                quantity: 150,
                location: 'Ludhiana, Punjab',
                image: '/produce/cauliflower.jpg'
            },
            {
                id: tomatoId,
                farmerId: farmer1Id,
                cropName: 'Tomato',
                price: 28,
                quantity: 340,
                location: 'Patiala, Punjab',
                image: '/produce/tomato.jpg'
            },
            {
                id: spinachId,
                farmerId: farmer1Id,
                cropName: 'Spinach',
                price: 22,
                quantity: 210,
                location: 'Ludhiana, Punjab',
                image: '/produce/spinach.jpg'
            },
            {
                id: potatoId,
                farmerId: farmer2Id,
                cropName: 'Potato',
                price: 26,
                quantity: 500,
                location: 'Anand, Gujarat',
                image: '/produce/potato.jpg'
            },
            {
                id: cucumberId,
                farmerId: farmer2Id,
                cropName: 'Cucumber',
                price: 32,
                quantity: 175,
                location: 'Junagadh, Gujarat',
                image: '/produce/cucumber.jpg'
            },
            {
                id: chilliId,
                farmerId: farmer2Id,
                cropName: 'Chilli',
                price: 44,
                quantity: 130,
                location: 'Ahmedabad, Gujarat',
                image: '/produce/chilli.jpg'
            },
            {
                id: carrotId,
                farmerId: farmer3Id,
                cropName: 'Carrot',
                price: 30,
                quantity: 165,
                location: 'Karnal, Haryana',
                image: '/produce/carrot.jpg'
            },
            {
                id: okraId,
                farmerId: farmer3Id,
                cropName: 'Okra',
                price: 40,
                quantity: 190,
                location: 'Panipat, Haryana',
                image: '/produce/okra.jpg'
            },
            {
                id: cabbageId,
                farmerId: farmer3Id,
                cropName: 'Cabbage',
                price: 24,
                quantity: 200,
                location: 'Sonipat, Haryana',
                image: '/produce/cabbage.jpg'
            },
            {
                farmerId: farmer4Id,
                id: brinjalId,
                cropName: 'Brinjal',
                price: 36,
                quantity: 145,
                location: 'Mysuru, Karnataka',
                image: '/produce/brinjal.jpg'
            },
            {
                farmerId: farmer4Id,
                id: beansId,
                cropName: 'Beans',
                price: 34,
                quantity: 155,
                location: 'Mandya, Karnataka',
                image: '/produce/beans.jpg'
            },
            {
                farmerId: farmer4Id,
                id: beetrootId,
                cropName: 'Beetroot',
                price: 29,
                quantity: 120,
                location: 'Mysuru, Karnataka',
                image: '/produce/beetroot.jpg'
            },
            {
                id: appleId,
                farmerId: farmer1Id,
                cropName: 'Apple',
                price: 110,
                quantity: 95,
                location: 'Ludhiana, Punjab',
                image: '/produce/apple.jpg'
            },
            {
                id: bananaId,
                farmerId: farmer2Id,
                cropName: 'Banana',
                price: 55,
                quantity: 220,
                location: 'Anand, Gujarat',
                image: '/produce/banana.jpg'
            },
            {
                id: orangeId,
                farmerId: farmer3Id,
                cropName: 'Orange',
                price: 78,
                quantity: 130,
                location: 'Karnal, Haryana',
                image: '/produce/orange.jpg'
            },
            {
                id: grapesId,
                farmerId: farmer4Id,
                cropName: 'Grapes',
                price: 96,
                quantity: 115,
                location: 'Mysuru, Karnataka',
                image: '/produce/grapes.jpg'
            },
            {
                id: greenGrapesId,
                farmerId: farmer2Id,
                cropName: 'Green Grapes',
                price: 102,
                quantity: 108,
                location: 'Ahmedabad, Gujarat',
                image: '/produce/green-grapes.jpg'
            },
            {
                id: strawberryId,
                farmerId: farmer3Id,
                cropName: 'Strawberry',
                price: 125,
                quantity: 84,
                location: 'Panipat, Haryana',
                image: '/produce/strawberry.jpg'
            },
            {
                id: watermelonId,
                farmerId: farmer4Id,
                cropName: 'Watermelon',
                price: 42,
                quantity: 160,
                location: 'Mandya, Karnataka',
                image: '/produce/watermelon.jpg'
            },
            {
                id: mosambiId,
                farmerId: farmer1Id,
                cropName: 'Mosambi',
                price: 72,
                quantity: 110,
                location: 'Patiala, Punjab',
                image: '/produce/mosambi.jpg'
            },
            {
                id: lemonId,
                farmerId: farmer1Id,
                cropName: 'Lemon',
                price: 60,
                quantity: 170,
                location: 'Ludhiana, Punjab',
                image: '/produce/lemon.avif'
            }
        ]);

        console.log('✅ Products created!');

        // Create sample orders in different states
        const deliveredOrderId = generateId();
        const pendingOrderId = generateId();
        const acceptedOrderId = generateId();
        const rejectedOrderId = generateId();
        const completedOrderId = generateId();

        await db.insert(orders).values([
            {
                id: deliveredOrderId,
                productId: tomatoId,
                farmerId: farmer1Id,
                buyerId: buyer1Id,
                quantity: 20,
                totalPrice: 560,
                deliveryMethod: 'farmer_delivery',
                paymentMethod: 'upi',
                paymentStatus: 'completed',
                orderStatus: 'delivered'
            },
            {
                id: pendingOrderId,
                productId: greenGrapesId,
                farmerId: farmer2Id,
                buyerId: buyer2Id,
                quantity: 12,
                totalPrice: 1224,
                deliveryMethod: 'buyer_pickup',
                paymentMethod: 'bank_transfer',
                paymentStatus: 'pending',
                orderStatus: 'pending'
            },
            {
                id: acceptedOrderId,
                productId: okraId,
                farmerId: farmer3Id,
                buyerId: buyer1Id,
                quantity: 8,
                totalPrice: 320,
                deliveryMethod: 'local_transport',
                paymentMethod: 'upi',
                paymentStatus: 'completed',
                orderStatus: 'accepted'
            },
            {
                id: rejectedOrderId,
                productId: watermelonId,
                farmerId: farmer4Id,
                buyerId: buyer3Id,
                quantity: 5,
                totalPrice: 210,
                deliveryMethod: 'farmer_delivery',
                paymentMethod: 'bank_transfer',
                paymentStatus: 'completed',
                orderStatus: 'rejected'
            },
            {
                id: completedOrderId,
                productId: bananaId,
                farmerId: farmer2Id,
                buyerId: buyer3Id,
                quantity: 18,
                totalPrice: 990,
                deliveryMethod: 'buyer_pickup',
                paymentMethod: 'upi',
                paymentStatus: 'completed',
                orderStatus: 'completed'
            }
        ]);

        console.log('✅ Orders created!');

        // Create reviews for delivered/completed history
        await db.insert(reviews).values([
            {
                id: generateId(),
                orderId: deliveredOrderId,
                productId: tomatoId,
                buyerId: buyer1Id,
                rating: 5,
                comment: 'Very fresh tomatoes and quick delivery.'
            },
            {
                id: generateId(),
                orderId: completedOrderId,
                productId: bananaId,
                buyerId: buyer3Id,
                rating: 4,
                comment: 'Good quality bananas and fair pricing. Will order again.'
            }
        ]);

        console.log('✅ Reviews created!');
        console.log('\n📊 Database seeded successfully!');
        console.log('   - 8 users (4 farmers, 3 buyers, 1 admin)');
        console.log('   - 21 products (fruits + vegetables from mini assets)');
        console.log('   - 5 orders with mixed statuses');
        console.log('   - 2 reviews\n');
        console.log('🔐 Test Credentials (password: password123):');
        console.log('   Farmer: farmer1@example.com');
        console.log('   Farmer: farmer2@example.com');
        console.log('   Buyer:  buyer1@example.com');
        console.log('   Buyer:  buyer2@example.com\n');
        console.log('   Admin:  admin@farmse.local\n');

    } catch (error: any) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run seeding
clearAndSeedDatabase();
