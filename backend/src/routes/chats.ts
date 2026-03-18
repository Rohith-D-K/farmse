import { FastifyInstance } from 'fastify';
import { db } from '../db/index';
import { chats, messages, users, products } from '../db/schema';
import { eq, and, or, desc, sql, aliasedTable } from 'drizzle-orm';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { generateId } from '../utils/auth';

const buyers = aliasedTable(users, 'buyers');
const farmers = aliasedTable(users, 'farmers');

export const chatRoutes = async (fastify: FastifyInstance) => {
  // Start or get existing chat
  fastify.post('/api/chats/start', {
    preHandler: authenticate
  }, async (request: AuthenticatedRequest, reply) => {
    const { productId, farmerId } = request.body as {
      productId: string;
      farmerId: string;
    };
    const buyerId = request.user!.id;

    try {
      // Check if chat already exists
      const [existingChat] = await db
        .select()
        .from(chats)
        .where(
          and(
            eq(chats.productId, productId),
            eq(chats.buyerId, buyerId),
            eq(chats.farmerId, farmerId)
          )
        )
        .limit(1);

      if (existingChat) {
        return reply.send(existingChat);
      }

      const chatId = generateId();
      await db.insert(chats).values({
        id: chatId,
        productId,
        buyerId,
        farmerId
      });

      const [newChat] = await db
        .select()
        .from(chats)
        .where(eq(chats.id, chatId))
        .limit(1);

      return reply.send(newChat);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Get messages for a chat
  fastify.get('/api/chats/:chatId/messages', {
    preHandler: authenticate
  }, async (request: AuthenticatedRequest, reply) => {
    const { chatId } = request.params as { chatId: string };

    try {
      const chatMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId));

      return reply.send(chatMessages);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Send a message
  fastify.post('/api/chats/:chatId/message', {
    preHandler: authenticate
  }, async (request: AuthenticatedRequest, reply) => {
    const { chatId } = request.params as { chatId: string };
    const { text: msgText } = request.body as { text: string };
    const senderId = request.user!.id;

    try {
      const msgId = generateId();
      await db.insert(messages).values({
        id: msgId,
        chatId,
        senderId,
        text: msgText
      });

      const [newMessage] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, msgId))
        .limit(1);

      // Emit via Socket.IO if available
      if ((fastify as any).io) {
        (fastify as any).io.to(chatId).emit('new_message', newMessage);
      }

      return reply.send(newMessage);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Get all chats for a user
  fastify.get('/api/chats/user/:userId', {
    preHandler: authenticate
  }, async (request: AuthenticatedRequest, reply) => {
    const { userId } = request.params as { userId: string };

    try {
      const userChats = await db
        .select({
          id: chats.id,
          productId: chats.productId,
          buyerId: chats.buyerId,
          farmerId: chats.farmerId,
          createdAt: chats.createdAt,
          productName: products.cropName,
          buyerName: buyers.name,
          farmerName: farmers.name
        })
        .from(chats)
        .leftJoin(products, eq(chats.productId, products.id))
        .leftJoin(buyers, eq(chats.buyerId, buyers.id))
        .leftJoin(farmers, eq(chats.farmerId, farmers.id))
        .where(
          or(
            eq(chats.buyerId, userId),
            eq(chats.farmerId, userId)
          )
        );

      return reply.send(userChats);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });
};
