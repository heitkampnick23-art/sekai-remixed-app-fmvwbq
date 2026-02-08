import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, or } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import { z } from 'zod';

const createStorySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  genre: z.string().min(1),
  characterId: z.string().uuid(),
  content: z.any(),
  isPublic: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
});

const updateStorySchema = createStorySchema.partial();

export function registerStoryRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // Get all public stories with filters
  app.fastify.get<{
    Querystring: { public?: string; genre?: string; limit?: string; offset?: string };
  }>(
    '/api/stories',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const queryObj = request.query as { public?: string; genre?: string; limit?: string; offset?: string };
      const isPublic = queryObj.public;
      const genre = queryObj.genre;
      const limit = queryObj.limit || '20';
      const offset = queryObj.offset || '0';

      app.logger.info({ isPublic, genre, limit, offset }, 'Fetching stories');

      try {
        const limitNum = Math.min(parseInt(limit), 100);
        const offsetNum = parseInt(offset);

        let stories: any[];

        if (isPublic === 'true' && genre) {
          stories = await app.db
            .select()
            .from(schema.stories)
            .where(and(eq(schema.stories.isPublic, true), eq(schema.stories.genre, genre)))
            .limit(limitNum)
            .offset(offsetNum);
        } else if (isPublic === 'true') {
          stories = await app.db
            .select()
            .from(schema.stories)
            .where(eq(schema.stories.isPublic, true))
            .limit(limitNum)
            .offset(offsetNum);
        } else if (genre) {
          stories = await app.db
            .select()
            .from(schema.stories)
            .where(eq(schema.stories.genre, genre))
            .limit(limitNum)
            .offset(offsetNum);
        } else {
          stories = await app.db
            .select()
            .from(schema.stories)
            .limit(limitNum)
            .offset(offsetNum);
        }

        app.logger.info({ count: stories.length }, 'Stories fetched successfully');
        return stories;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch stories');
        throw error;
      }
    }
  );

  // Get story by ID
  app.fastify.get<{ Params: { id: string } }>(
    '/api/stories/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const paramsObj = request.params as { id: string };
      const id = paramsObj.id;

      app.logger.info({ storyId: id }, 'Fetching story');

      try {
        const story = await app.db
          .select()
          .from(schema.stories)
          .where(eq(schema.stories.id, id))
          .then((rows) => rows[0]);

        if (!story) {
          app.logger.warn({ storyId: id }, 'Story not found');
          return reply.status(404).send({ error: 'Story not found' });
        }

        app.logger.info({ storyId: id }, 'Story fetched successfully');
        return story;
      } catch (error) {
        app.logger.error({ err: error, storyId: id }, 'Failed to fetch story');
        throw error;
      }
    }
  );

  // Create story
  app.fastify.post<{ Body: z.infer<typeof createStorySchema> }>(
    '/api/stories',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const validation = createStorySchema.safeParse(request.body);
      if (!validation.success) {
        app.logger.warn({ errors: validation.error.issues }, 'Invalid story data');
        return reply.status(400).send({ error: 'Invalid story data' });
      }

      app.logger.info({ userId: session.user.id, body: request.body }, 'Creating story');

      try {
        const [story] = await app.db
          .insert(schema.stories)
          .values({
            userId: session.user.id,
            characterId: validation.data.characterId,
            title: validation.data.title,
            description: validation.data.description,
            genre: validation.data.genre,
            content: validation.data.content,
            isPublic: validation.data.isPublic ?? false,
            isPrivate: validation.data.isPrivate ?? false,
          })
          .returning();

        app.logger.info({ storyId: story.id, userId: session.user.id }, 'Story created successfully');
        return story;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to create story');
        throw error;
      }
    }
  );

  // Update story
  app.fastify.put<{ Params: { id: string }; Body: z.infer<typeof updateStorySchema> }>(
    '/api/stories/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const paramsObj = request.params as { id: string };
      const id = paramsObj.id;

      app.logger.info({ storyId: id, userId: session.user.id, body: request.body }, 'Updating story');

      try {
        const story = await app.db
          .select()
          .from(schema.stories)
          .where(eq(schema.stories.id, id))
          .then((rows) => rows[0]);

        if (!story) {
          app.logger.warn({ storyId: id }, 'Story not found');
          return reply.status(404).send({ error: 'Story not found' });
        }

        if (story.userId !== session.user.id) {
          app.logger.warn({ storyId: id, userId: session.user.id }, 'Unauthorized story update');
          return reply.status(403).send({ error: 'Unauthorized' });
        }

        const validation = updateStorySchema.safeParse(request.body);
        if (!validation.success) {
          app.logger.warn({ errors: validation.error.issues }, 'Invalid story data');
          return reply.status(400).send({ error: 'Invalid story data' });
        }

        const updateData: Record<string, any> = {};
        if (validation.data.title !== undefined) updateData.title = validation.data.title;
        if (validation.data.description !== undefined) updateData.description = validation.data.description;
        if (validation.data.genre !== undefined) updateData.genre = validation.data.genre;
        if (validation.data.content !== undefined) updateData.content = validation.data.content;
        if (validation.data.isPublic !== undefined) updateData.isPublic = validation.data.isPublic;
        if (validation.data.isPrivate !== undefined) updateData.isPrivate = validation.data.isPrivate;

        const [updated] = await app.db
          .update(schema.stories)
          .set(updateData)
          .where(eq(schema.stories.id, id))
          .returning();

        app.logger.info({ storyId: id, userId: session.user.id }, 'Story updated successfully');
        return updated;
      } catch (error) {
        app.logger.error({ err: error, storyId: id, userId: session.user.id }, 'Failed to update story');
        throw error;
      }
    }
  );

  // Delete story
  app.fastify.delete<{ Params: { id: string } }>(
    '/api/stories/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const paramsObj = request.params as { id: string };
      const id = paramsObj.id;

      app.logger.info({ storyId: id, userId: session.user.id }, 'Deleting story');

      try {
        const story = await app.db
          .select()
          .from(schema.stories)
          .where(eq(schema.stories.id, id))
          .then((rows) => rows[0]);

        if (!story) {
          app.logger.warn({ storyId: id }, 'Story not found');
          return reply.status(404).send({ error: 'Story not found' });
        }

        if (story.userId !== session.user.id) {
          app.logger.warn({ storyId: id, userId: session.user.id }, 'Unauthorized story delete');
          return reply.status(403).send({ error: 'Unauthorized' });
        }

        await app.db.delete(schema.stories).where(eq(schema.stories.id, id));

        app.logger.info({ storyId: id, userId: session.user.id }, 'Story deleted successfully');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, storyId: id, userId: session.user.id }, 'Failed to delete story');
        throw error;
      }
    }
  );

  // Export story
  app.fastify.post<{ Params: { id: string } }>(
    '/api/stories/:id/export',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const paramsObj = request.params as { id: string };
      const id = paramsObj.id;

      app.logger.info({ storyId: id, userId: session.user.id }, 'Exporting story');

      try {
        const appUser = await app.db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, session.user.id))
          .then((rows) => rows[0]);

        const story = await app.db
          .select()
          .from(schema.stories)
          .where(eq(schema.stories.id, id))
          .then((rows) => rows[0]);

        if (!story) {
          app.logger.warn({ storyId: id }, 'Story not found');
          return reply.status(404).send({ error: 'Story not found' });
        }

        if (story.userId !== session.user.id) {
          app.logger.warn({ storyId: id, userId: session.user.id }, 'Unauthorized story export');
          return reply.status(403).send({ error: 'Unauthorized' });
        }

        const isPremium = appUser?.isPremium ?? false;

        if (isPremium) {
          // Premium: PDF export
          app.logger.info({ storyId: id, userId: session.user.id }, 'Exporting story as PDF');
          return {
            format: 'pdf',
            downloadUrl: `/api/stories/${id}/export/pdf`,
            title: story.title,
          };
        } else {
          // Free: text export
          app.logger.info({ storyId: id, userId: session.user.id }, 'Exporting story as text');
          return {
            format: 'text',
            content: `${story.title}\n\n${story.description}\n\n${JSON.stringify(story.content)}`,
            title: story.title,
          };
        }
      } catch (error) {
        app.logger.error({ err: error, storyId: id, userId: session.user.id }, 'Failed to export story');
        throw error;
      }
    }
  );
}
