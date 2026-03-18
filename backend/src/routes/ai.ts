import { FastifyInstance } from 'fastify';
import { db } from '../db/index';
import { products } from '../db/schema';
import { sql } from 'drizzle-orm';

interface ProductSummary {
  cropName: string;
  minPrice: number;
  maxPrice: number;
  totalQty: number;
  count: number;
}

async function getAvailableProducts(): Promise<ProductSummary[]> {
  return db.select({
    cropName: products.cropName,
    minPrice: sql<number>`MIN(${products.price})`,
    maxPrice: sql<number>`MAX(${products.price})`,
    totalQty: sql<number>`SUM(${products.quantity})`,
    count: sql<number>`COUNT(*)`,
  })
    .from(products)
    .where(sql`${products.quantity} > 0`)
    .groupBy(products.cropName)
    .orderBy(sql`SUM(${products.quantity}) DESC`)
    .limit(20);
}

function handleChat(message: string, role: string, available: ProductSummary[]): { response: string; suggestions: string[] } {
  const msg = message.toLowerCase();

  // Products / availability / price queries
  if (msg.match(/product|available|price|cost|crop|vegetable|fruit|what.*sell|buy|browse|list/)) {
    if (available.length === 0) {
      return {
        response: 'No products are currently available on the platform. Check back later! 🌱',
        suggestions: ['How do I use the app?', 'Contact a farmer'],
      };
    }
    const lines = available.map(p => {
      const price = p.minPrice === p.maxPrice ? `₹${p.minPrice}/kg` : `₹${p.minPrice}–₹${p.maxPrice}/kg`;
      return `• **${p.cropName}** — ${price} (${p.totalQty}kg from ${p.count} seller${p.count > 1 ? 's' : ''})`;
    });
    return {
      response: `Here are the available products:\n\n${lines.join('\n')}\n\nBrowse the **Marketplace** to order! 🛒`,
      suggestions: role === 'farmer'
        ? ['How to add a product?', 'Price suggestions', 'My orders']
        : ['How to place an order?', 'Delivery options', 'Chat with farmer'],
    };
  }

  // Order related
  if (msg.match(/order|deliver|pickup|track|status/)) {
    if (role === 'farmer') {
      return {
        response: 'Go to your **Dashboard** to view and manage incoming orders. You can accept, mark as packed, or mark as delivered. 📦',
        suggestions: ['Available products', 'How to add a product?', 'Price suggestions'],
      };
    }
    return {
      response: 'You can place orders from the **Marketplace** and track them from the **Orders** page. Choose between pickup or delivery! 🚚',
      suggestions: ['Available products', 'Chat with farmer', 'How to review?'],
    };
  }

  // How to use / help / getting started
  if (msg.match(/how.*use|help|guide|tutorial|start|feature|getting started/)) {
    if (role === 'farmer') {
      return {
        response: '**Getting started as a Farmer:**\n• Go to **Add Product** to list your crops\n• Set prices (AI suggests based on local market)\n• Manage orders from your **Dashboard**\n• Chat with buyers directly\n• Check **Reviews** to build your reputation 🌾',
        suggestions: ['Available products', 'How to add a product?', 'Price suggestions'],
      };
    }
    return {
      response: '**Getting started as a Buyer:**\n• Browse the **Marketplace** to see nearby produce\n• Add items to cart and place orders\n• Choose **pickup** or **delivery**\n• Chat with farmers directly\n• Leave **reviews** after delivery 🛒',
      suggestions: ['Available products', 'How to place an order?', 'Chat with farmer'],
    };
  }

  // Add product (farmer)
  if (msg.match(/add.*product|list.*crop|how.*sell|add.*crop|new.*listing/)) {
    return {
      response: role === 'farmer'
        ? '**To add a product:**\n• Tap **Add Product** from your Dashboard\n• Enter crop name — the image & price are auto-suggested!\n• Set quantity and location\n• Hit **Add Product** and you\'re live! 🌾'
        : 'Only **farmers** can add products. Switch to a farmer account or register as a farmer to start selling! 🧑‍🌾',
      suggestions: role === 'farmer'
        ? ['Price suggestions', 'My orders', 'Available products']
        : ['Available products', 'How to place an order?', 'Help'],
    };
  }

  // Pricing advice
  if (msg.match(/pricing|suggest.*price|how.*price|market.*rate/)) {
    return {
      response: 'When you add a product, FarmSe automatically suggests a price based on what other farmers within **200km** are charging. You\'ll see the average, min, and max prices — and can apply with one tap! 💡',
      suggestions: role === 'farmer'
        ? ['How to add a product?', 'My orders', 'Available products']
        : ['Available products', 'How to place an order?', 'Help'],
    };
  }

  // Review
  if (msg.match(/review|rate|rating|feedback/)) {
    return {
      response: role === 'buyer'
        ? 'After your order is **delivered**, you can leave a review for the farmer! Go to **Orders** → tap the completed order → **Write Review**. Your feedback helps other buyers! ⭐'
        : 'Buyers can leave reviews after delivery. Good reviews help you get more orders! Check your **Profile** to see your ratings. ⭐',
      suggestions: ['Available products', 'My orders', 'Help'],
    };
  }

  // Chat / contact
  if (msg.match(/chat|message|talk|contact/)) {
    return {
      response: 'You can **chat directly** with farmers/buyers! Go to a product or order and tap the chat icon to start a real-time conversation. 💬',
      suggestions: ['Available products', 'My orders', 'How do I use the app?'],
    };
  }

  // Greeting
  if (msg.match(/^(hi|hello|hey|namaste|vanakkam)\b/)) {
    return {
      response: `Hello! 👋 Welcome to FarmSe. I'm your assistant. As a **${role}**, how can I help you today?`,
      suggestions: role === 'farmer'
        ? ['Available products', 'How to add a product?', 'My orders', 'Price suggestions']
        : ['Available products', 'How to place an order?', 'Delivery options', 'Help'],
    };
  }

  // Thank you
  if (msg.match(/thank|thanks|ok|great|good/)) {
    return {
      response: "You're welcome! Let me know if you need anything else. Happy farming! 🌿",
      suggestions: role === 'farmer'
        ? ['Available products', 'My orders', 'How to add a product?']
        : ['Available products', 'My orders', 'Help'],
    };
  }

  // Default — show all options
  return {
    response: `I can help you with:\n• **Available products** and prices\n• **How to ${role === 'farmer' ? 'sell' : 'buy'}** on FarmSe\n• **Orders** and delivery\n• **Chatting** with ${role === 'farmer' ? 'buyers' : 'farmers'}\n\nTap a suggestion below or type your question! 😊`,
    suggestions: role === 'farmer'
      ? ['Available products', 'How to add a product?', 'My orders', 'Price suggestions']
      : ['Available products', 'How to place an order?', 'Delivery options', 'Help'],
  };
}

export const aiRoutes = async (fastify: FastifyInstance) => {
  fastify.post('/api/ai/chat', async (request, reply) => {
    const { message, role = 'buyer' } = request.body as {
      message: string;
      language?: string;
      role?: string;
    };

    if (!message) {
      return reply.status(400).send({ error: 'Message is required' });
    }

    const available = await getAvailableProducts();
    const result = handleChat(message, role, available);
    return { response: result.response, suggestions: result.suggestions, type: 'keyword' };
  });
};
