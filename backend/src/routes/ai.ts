import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import { z } from 'zod';
import { gateway } from '@specific-dev/framework';
import { generateText, generateObject } from 'ai';

const chatSchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1),
  characterId: z.string().uuid(),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
});

const generateImageSchema = z.object({
  prompt: z.string().min(1),
  style: z.string().min(1),
});

const generateStorySchema = z.object({
  prompt: z.string().min(1),
  genre: z.string().min(1),
  characterIds: z.array(z.string().uuid()),
});

const dailyLimit = 5;

export function registerAiRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // Chat with AI character
  app.fastify.post<{ Body: z.infer<typeof chatSchema> }>(
    '/api/ai/chat',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const validation = chatSchema.safeParse(request.body);
      if (!validation.success) {
        app.logger.warn({ errors: validation.error.issues }, 'Invalid chat data');
        return reply.status(400).send({ error: 'Invalid chat data' });
      }

      app.logger.info({ userId: session.user.id, conversationId: validation.data.conversationId }, 'AI chat requested');

      try {
        const appUser = await app.db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, session.user.id))
          .then((rows) => rows[0]);

        // Check daily limit for free users
        if (!appUser?.isPremium) {
          if (appUser && appUser.dailyAiConversationsUsed >= dailyLimit) {
            app.logger.warn({ userId: session.user.id, used: appUser.dailyAiConversationsUsed }, 'Daily chat limit exceeded');
            return reply.status(429).send({ error: `Daily limit of ${dailyLimit} chats exceeded` });
          }
        }

        const character = await app.db
          .select()
          .from(schema.characters)
          .where(eq(schema.characters.id, validation.data.characterId))
          .then((rows) => rows[0]);

        if (!character) {
          app.logger.warn({ characterId: validation.data.characterId }, 'Character not found');
          return reply.status(404).send({ error: 'Character not found' });
        }

        const systemPrompt = `You are ${character.name}. ${character.description}
Personality: ${character.personality}
Backstory: ${character.backstory}
Style: ${character.style}`;

        const messages = [
          ...validation.data.conversationHistory,
          { role: 'user' as const, content: validation.data.message },
        ];

        const result = await generateText({
          model: gateway('openai/gpt-5.2'),
          system: systemPrompt,
          messages: messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        });

        // Update conversation messages
        const conversation = await app.db
          .select()
          .from(schema.conversations)
          .where(eq(schema.conversations.id, validation.data.conversationId))
          .then((rows) => rows[0]);

        if (conversation) {
          const currentMessages = Array.isArray(conversation.messages) ? conversation.messages : [];
          const updatedMessages = [
            ...currentMessages,
            { role: 'user', content: validation.data.message },
            { role: 'assistant', content: result.text },
          ];

          await app.db
            .update(schema.conversations)
            .set({ messages: updatedMessages })
            .where(eq(schema.conversations.id, validation.data.conversationId));
        }

        // Update daily conversation count for free users
        if (!appUser?.isPremium && appUser) {
          // Check if reset needed (24 hours)
          const now = new Date();
          const lastReset = new Date(appUser.lastConversationReset);
          const hoursDiff = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

          if (hoursDiff >= 24) {
            await app.db
              .update(schema.users)
              .set({
                dailyAiConversationsUsed: 1,
                lastConversationReset: now,
              })
              .where(eq(schema.users.id, session.user.id));
          } else {
            await app.db
              .update(schema.users)
              .set({ dailyAiConversationsUsed: appUser.dailyAiConversationsUsed + 1 })
              .where(eq(schema.users.id, session.user.id));
          }
        }

        app.logger.info({ userId: session.user.id, conversationId: validation.data.conversationId }, 'AI chat completed successfully');
        return {
          response: result.text,
          conversationId: validation.data.conversationId,
        };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to process AI chat');
        throw error;
      }
    }
  );

  // Generate image with AI
  app.fastify.post<{ Body: z.infer<typeof generateImageSchema> }>(
    '/api/ai/generate-image',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const validation = generateImageSchema.safeParse(request.body);
      if (!validation.success) {
        app.logger.warn({ errors: validation.error.issues }, 'Invalid image generation data');
        return reply.status(400).send({ error: 'Invalid image generation data' });
      }

      app.logger.info({ userId: session.user.id, prompt: validation.data.prompt }, 'Image generation requested');

      try {
        const appUser = await app.db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, session.user.id))
          .then((rows) => rows[0]);

        if (!appUser?.isPremium) {
          app.logger.warn({ userId: session.user.id }, 'Image generation requires premium');
          return reply.status(403).send({ error: 'Image generation is only available for premium users' });
        }

        const result = await generateText({
          model: gateway('google/gemini-2.5-flash-image'),
          prompt: `Create an image in ${validation.data.style} style: ${validation.data.prompt}`,
        });

        // Extract image from result
        const imageFiles = (result.files || []).filter((f: any) => f.mediaType?.startsWith('image/'));
        const imageUrl = imageFiles.length > 0 ? `data:${imageFiles[0].mediaType};base64,${Buffer.from(imageFiles[0].uint8Array).toString('base64')}` : null;

        if (!imageUrl) {
          app.logger.warn({ userId: session.user.id }, 'No image generated');
          return reply.status(500).send({ error: 'Failed to generate image' });
        }

        app.logger.info({ userId: session.user.id }, 'Image generated successfully');
        return { imageUrl };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to generate image');
        throw error;
      }
    }
  );

  // Generate story with AI
  app.fastify.post<{ Body: z.infer<typeof generateStorySchema> }>(
    '/api/ai/generate-story',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const validation = generateStorySchema.safeParse(request.body);
      if (!validation.success) {
        app.logger.warn({ errors: validation.error.issues }, 'Invalid story generation data');
        return reply.status(400).send({ error: 'Invalid story generation data' });
      }

      app.logger.info({ userId: session.user.id, prompt: validation.data.prompt }, 'Story generation requested');

      try {
        const storySchema = z.object({
          title: z.string(),
          description: z.string(),
          content: z.string(),
        });

        const { object } = await generateObject({
          model: gateway('openai/gpt-5.2'),
          schema: storySchema,
          schemaName: 'Story',
          schemaDescription: 'Generate a story with title, description, and content',
          prompt: `Generate a ${validation.data.genre} story based on this prompt: ${validation.data.prompt}`,
        });

        app.logger.info({ userId: session.user.id, title: object.title }, 'Story generated successfully');
        return {
          title: object.title,
          description: object.description,
          content: object.content,
        };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to generate story');
        throw error;
      }
    }
  );
}
