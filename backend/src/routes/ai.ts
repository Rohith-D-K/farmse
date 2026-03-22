import { FastifyInstance } from 'fastify';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { getAiResponse } from '../services/aiChat';

export const aiRoutes = async (fastify: FastifyInstance) => {
  /**
   * POST /api/ai/chat (Legacy / Existing UI Compatibility)
   * Request: { message: string, language?: string, role?: string }
   */
  fastify.post('/api/ai/chat', { preHandler: authenticate }, async (request: AuthenticatedRequest, reply) => {
    const { message, language = 'en', role: roleOverride } = request.body as {
      message: string;
      language?: string;
      role?: string;
    };

    if (!message) {
      return reply.code(400).send({ error: 'Message is required' });
    }

    try {
      const role = roleOverride || request.user?.role || 'buyer';
      const location = request.user?.latitude && request.user?.longitude 
          ? { lat: request.user.latitude, lng: request.user.longitude } 
          : undefined;

      const result = await getAiResponse(message, language, role, location);
      
      // Return in format expected by existing frontend
      return reply.send({ 
        response: result.response, 
        suggestions: result.suggestions, 
        type: 'ai' 
      });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message || 'AI Chat failed' });
    }
  });

  /**
   * POST /api/chat (New Backend Chat API requirement)
   * Request: { message: string, userId?: string, location?: {lat, lng} }
   */
  fastify.post('/api/chat', { preHandler: authenticate }, async (request: AuthenticatedRequest, reply) => {
    const { message, location: locOverride } = request.body as {
      message: string;
      userId?: string;
      location?: { lat: number; lng: number };
    };

    if (!message) {
      return reply.code(400).send({ error: 'Message is required' });
    }

    try {
      const role = request.user?.role || 'buyer';
      const lang = 'en'; // Default for technical API
      const location = locOverride || (request.user?.latitude && request.user?.longitude 
          ? { lat: request.user.latitude, lng: request.user.longitude } 
          : undefined);

      const result = await getAiResponse(message, lang, role, location);
      
      // Return in format requested by user: { reply: "..." }
      return reply.send({ 
        reply: result.response 
      });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message || 'AI Chat failed' });
    }
  });
};

