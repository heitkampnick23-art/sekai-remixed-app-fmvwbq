import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, or, isNull } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import { z } from 'zod';

const createCharacterSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  personality: z.string().min(1),
  backstory: z.string().min(1),
  style: z.string().min(1),
  isPublic: z.boolean().optional(),
  avatarUrl: z.string().optional(),
});

const updateCharacterSchema = createCharacterSchema.partial();

export function registerCharacterRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // Get all public characters with filters
  app.fastify.get<{
    Querystring: { public?: string; style?: string; limit?: string; offset?: string };
  }>(
    '/api/characters',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const queryObj = request.query as { public?: string; style?: string; limit?: string; offset?: string };
      const isPublic = queryObj.public;
      const style = queryObj.style;
      const limit = queryObj.limit || '20';
      const offset = queryObj.offset || '0';

      app.logger.info({ isPublic, style, limit, offset }, 'Fetching characters');

      try {
        const limitNum = Math.min(parseInt(limit), 100);
        const offsetNum = parseInt(offset);

        let characters: any[];

        if (isPublic === 'true' && style) {
          characters = await app.db
            .select()
            .from(schema.characters)
            .where(and(eq(schema.characters.isPublic, true), eq(schema.characters.style, style)))
            .limit(limitNum)
            .offset(offsetNum);
        } else if (isPublic === 'true') {
          characters = await app.db
            .select()
            .from(schema.characters)
            .where(eq(schema.characters.isPublic, true))
            .limit(limitNum)
            .offset(offsetNum);
        } else if (style) {
          characters = await app.db
            .select()
            .from(schema.characters)
            .where(eq(schema.characters.style, style))
            .limit(limitNum)
            .offset(offsetNum);
        } else {
          characters = await app.db
            .select()
            .from(schema.characters)
            .limit(limitNum)
            .offset(offsetNum);
        }

        app.logger.info({ count: characters.length }, 'Characters fetched successfully');
        return characters;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch characters');
        throw error;
      }
    }
  );

  // Get character by ID
  app.fastify.get<{ Params: { id: string } }>(
    '/api/characters/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const paramsObj = request.params as { id: string };
      const id = paramsObj.id;

      app.logger.info({ characterId: id }, 'Fetching character');

      try {
        const character = await app.db
          .select()
          .from(schema.characters)
          .where(eq(schema.characters.id, id))
          .then((rows) => rows[0]);

        if (!character) {
          app.logger.warn({ characterId: id }, 'Character not found');
          return reply.status(404).send({ error: 'Character not found' });
        }

        app.logger.info({ characterId: id }, 'Character fetched successfully');
        return character;
      } catch (error) {
        app.logger.error({ err: error, characterId: id }, 'Failed to fetch character');
        throw error;
      }
    }
  );

  // Create character
  app.fastify.post<{ Body: z.infer<typeof createCharacterSchema> }>(
    '/api/characters',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const validation = createCharacterSchema.safeParse(request.body);
      if (!validation.success) {
        app.logger.warn({ errors: validation.error.issues }, 'Invalid character data');
        return reply.status(400).send({ error: 'Invalid character data' });
      }

      app.logger.info({ userId: session.user.id, body: request.body }, 'Creating character');

      try {
        const [character] = await app.db
          .insert(schema.characters)
          .values({
            userId: session.user.id,
            name: validation.data.name,
            description: validation.data.description,
            personality: validation.data.personality,
            backstory: validation.data.backstory,
            style: validation.data.style,
            isPublic: validation.data.isPublic ?? false,
            avatarUrl: validation.data.avatarUrl,
          })
          .returning();

        app.logger.info({ characterId: character.id, userId: session.user.id }, 'Character created successfully');
        return character;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to create character');
        throw error;
      }
    }
  );

  // Update character
  app.fastify.put<{ Params: { id: string }; Body: z.infer<typeof updateCharacterSchema> }>(
    '/api/characters/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const paramsObj = request.params as { id: string };
      const id = paramsObj.id;

      app.logger.info({ characterId: id, userId: session.user.id, body: request.body }, 'Updating character');

      try {
        const character = await app.db
          .select()
          .from(schema.characters)
          .where(eq(schema.characters.id, id))
          .then((rows) => rows[0]);

        if (!character) {
          app.logger.warn({ characterId: id }, 'Character not found');
          return reply.status(404).send({ error: 'Character not found' });
        }

        if (character.userId !== session.user.id) {
          app.logger.warn({ characterId: id, userId: session.user.id }, 'Unauthorized character update');
          return reply.status(403).send({ error: 'Unauthorized' });
        }

        const validation = updateCharacterSchema.safeParse(request.body);
        if (!validation.success) {
          app.logger.warn({ errors: validation.error.issues }, 'Invalid character data');
          return reply.status(400).send({ error: 'Invalid character data' });
        }

        const updateData: Record<string, any> = {};
        if (validation.data.name !== undefined) updateData.name = validation.data.name;
        if (validation.data.description !== undefined) updateData.description = validation.data.description;
        if (validation.data.personality !== undefined) updateData.personality = validation.data.personality;
        if (validation.data.backstory !== undefined) updateData.backstory = validation.data.backstory;
        if (validation.data.style !== undefined) updateData.style = validation.data.style;
        if (validation.data.isPublic !== undefined) updateData.isPublic = validation.data.isPublic;
        if (validation.data.avatarUrl !== undefined) updateData.avatarUrl = validation.data.avatarUrl;

        const [updated] = await app.db
          .update(schema.characters)
          .set(updateData)
          .where(eq(schema.characters.id, id))
          .returning();

        app.logger.info({ characterId: id, userId: session.user.id }, 'Character updated successfully');
        return updated;
      } catch (error) {
        app.logger.error({ err: error, characterId: id, userId: session.user.id }, 'Failed to update character');
        throw error;
      }
    }
  );

  // Delete character
  app.fastify.delete<{ Params: { id: string } }>(
    '/api/characters/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const paramsObj = request.params as { id: string };
      const id = paramsObj.id;

      app.logger.info({ characterId: id, userId: session.user.id }, 'Deleting character');

      try {
        const character = await app.db
          .select()
          .from(schema.characters)
          .where(eq(schema.characters.id, id))
          .then((rows) => rows[0]);

        if (!character) {
          app.logger.warn({ characterId: id }, 'Character not found');
          return reply.status(404).send({ error: 'Character not found' });
        }

        if (character.userId !== session.user.id) {
          app.logger.warn({ characterId: id, userId: session.user.id }, 'Unauthorized character delete');
          return reply.status(403).send({ error: 'Unauthorized' });
        }

        await app.db.delete(schema.characters).where(eq(schema.characters.id, id));

        app.logger.info({ characterId: id, userId: session.user.id }, 'Character deleted successfully');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, characterId: id, userId: session.user.id }, 'Failed to delete character');
        throw error;
      }
    }
  );
}
