import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import { z } from 'zod';

const createConversationSchema = z.object({
  characterId: z.string().uuid(),
  storyId: z.string().uuid().optional(),
  title: z.string().min(1),
});

export function registerConversationRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // Get user's conversations
  app.fastify.get(
    '/api/conversations',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching user conversations');

      try {
        const conversations = await app.db
          .select()
          .from(schema.conversations)
          .where(eq(schema.conversations.userId, session.user.id));

        app.logger.info({ userId: session.user.id, count: conversations.length }, 'Conversations fetched successfully');
        return conversations;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch conversations');
        throw error;
      }
    }
  );

  // Get conversation by ID
  app.fastify.get<{ Params: { id: string } }>(
    '/api/conversations/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const paramsObj = request.params as { id: string };
      const id = paramsObj.id;

      app.logger.info({ conversationId: id, userId: session.user.id }, 'Fetching conversation');

      try {
        const conversation = await app.db
          .select()
          .from(schema.conversations)
          .where(eq(schema.conversations.id, id))
          .then((rows) => rows[0]);

        if (!conversation) {
          app.logger.warn({ conversationId: id }, 'Conversation not found');
          return reply.status(404).send({ error: 'Conversation not found' });
        }

        if (conversation.userId !== session.user.id) {
          app.logger.warn({ conversationId: id, userId: session.user.id }, 'Unauthorized conversation access');
          return reply.status(403).send({ error: 'Unauthorized' });
        }

        app.logger.info({ conversationId: id, userId: session.user.id }, 'Conversation fetched successfully');
        return conversation;
      } catch (error) {
        app.logger.error({ err: error, conversationId: id, userId: session.user.id }, 'Failed to fetch conversation');
        throw error;
      }
    }
  );

  // Create conversation
  app.fastify.post<{ Body: z.infer<typeof createConversationSchema> }>(
    '/api/conversations',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const validation = createConversationSchema.safeParse(request.body);
      if (!validation.success) {
        app.logger.warn({ errors: validation.error.issues }, 'Invalid conversation data');
        return reply.status(400).send({ error: 'Invalid conversation data' });
      }

      app.logger.info({ userId: session.user.id, body: request.body }, 'Creating conversation');

      try {
        const [conversation] = await app.db
          .insert(schema.conversations)
          .values({
            userId: session.user.id,
            characterId: validation.data.characterId,
            storyId: validation.data.storyId,
            title: validation.data.title,
            messages: [],
          })
          .returning();

        app.logger.info({ conversationId: conversation.id, userId: session.user.id }, 'Conversation created successfully');
        return conversation;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to create conversation');
        throw error;
      }
    }
  );

  // Delete conversation
  app.fastify.delete<{ Params: { id: string } }>(
    '/api/conversations/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const paramsObj = request.params as { id: string };
      const id = paramsObj.id;

      app.logger.info({ conversationId: id, userId: session.user.id }, 'Deleting conversation');

      try {
        const conversation = await app.db
          .select()
          .from(schema.conversations)
          .where(eq(schema.conversations.id, id))
          .then((rows) => rows[0]);

        if (!conversation) {
          app.logger.warn({ conversationId: id }, 'Conversation not found');
          return reply.status(404).send({ error: 'Conversation not found' });
        }

        if (conversation.userId !== session.user.id) {
          app.logger.warn({ conversationId: id, userId: session.user.id }, 'Unauthorized conversation delete');
          return reply.status(403).send({ error: 'Unauthorized' });
        }

        await app.db.delete(schema.conversations).where(eq(schema.conversations.id, id));

        app.logger.info({ conversationId: id, userId: session.user.id }, 'Conversation deleted successfully');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, conversationId: id, userId: session.user.id }, 'Failed to delete conversation');
        throw error;
      }
    }
  );
}
