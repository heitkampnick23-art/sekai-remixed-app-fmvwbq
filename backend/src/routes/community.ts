import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import { z } from 'zod';

const createPostSchema = z.object({
  contentType: z.string().min(1),
  contentId: z.string().uuid(),
  caption: z.string().optional(),
});

const createCommentSchema = z.object({
  content: z.string().min(1),
});

export function registerCommunityRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // Get community feed
  app.fastify.get<{ Querystring: { limit?: string; offset?: string } }>(
    '/api/community/feed',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const queryObj = request.query as { limit?: string; offset?: string };
      const limit = queryObj.limit || '20';
      const offset = queryObj.offset || '0';

      app.logger.info({ limit, offset }, 'Fetching community feed');

      try {
        const limitNum = Math.min(parseInt(limit), 100);
        const offsetNum = parseInt(offset);

        const posts = await app.db
          .select()
          .from(schema.communityPosts)
          .limit(limitNum)
          .offset(offsetNum);

        app.logger.info({ count: posts.length }, 'Community feed fetched successfully');
        return posts;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch community feed');
        throw error;
      }
    }
  );

  // Create community post
  app.fastify.post<{ Body: z.infer<typeof createPostSchema> }>(
    '/api/community/posts',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const validation = createPostSchema.safeParse(request.body);
      if (!validation.success) {
        app.logger.warn({ errors: validation.error.issues }, 'Invalid post data');
        return reply.status(400).send({ error: 'Invalid post data' });
      }

      app.logger.info({ userId: session.user.id, body: request.body }, 'Creating community post');

      try {
        const [post] = await app.db
          .insert(schema.communityPosts)
          .values({
            userId: session.user.id,
            contentType: validation.data.contentType,
            contentId: validation.data.contentId,
            caption: validation.data.caption,
          })
          .returning();

        app.logger.info({ postId: post.id, userId: session.user.id }, 'Community post created successfully');
        return post;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to create community post');
        throw error;
      }
    }
  );

  // Toggle like on post
  app.fastify.post<{ Params: { id: string } }>(
    '/api/community/posts/:id/like',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const paramsObj = request.params as { id: string };
      const id = paramsObj.id;

      app.logger.info({ postId: id, userId: session.user.id }, 'Toggling post like');

      try {
        const post = await app.db
          .select()
          .from(schema.communityPosts)
          .where(eq(schema.communityPosts.id, id))
          .then((rows) => rows[0]);

        if (!post) {
          app.logger.warn({ postId: id }, 'Post not found');
          return reply.status(404).send({ error: 'Post not found' });
        }

        // Note: In a full implementation, you would track likes in a separate table
        // For now, we'll just increment/decrement the count
        const [updated] = await app.db
          .update(schema.communityPosts)
          .set({ likesCount: post.likesCount + 1 })
          .where(eq(schema.communityPosts.id, id))
          .returning();

        app.logger.info({ postId: id, userId: session.user.id, likesCount: updated.likesCount }, 'Post like toggled successfully');
        return updated;
      } catch (error) {
        app.logger.error({ err: error, postId: id, userId: session.user.id }, 'Failed to toggle post like');
        throw error;
      }
    }
  );

  // Get post comments
  app.fastify.get<{ Params: { id: string }; Querystring: { limit?: string; offset?: string } }>(
    '/api/community/posts/:id/comments',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const paramsObj = request.params as { id: string };
      const id = paramsObj.id;
      const queryObj = request.query as { limit?: string; offset?: string };
      const limit = queryObj.limit || '20';
      const offset = queryObj.offset || '0';

      app.logger.info({ postId: id, limit, offset }, 'Fetching post comments');

      try {
        const post = await app.db
          .select()
          .from(schema.communityPosts)
          .where(eq(schema.communityPosts.id, id))
          .then((rows) => rows[0]);

        if (!post) {
          app.logger.warn({ postId: id }, 'Post not found');
          return reply.status(404).send({ error: 'Post not found' });
        }

        const limitNum = Math.min(parseInt(limit), 100);
        const offsetNum = parseInt(offset);

        const comments = await app.db
          .select()
          .from(schema.postComments)
          .where(eq(schema.postComments.postId, id))
          .limit(limitNum)
          .offset(offsetNum);

        app.logger.info({ postId: id, count: comments.length }, 'Post comments fetched successfully');
        return comments;
      } catch (error) {
        app.logger.error({ err: error, postId: id }, 'Failed to fetch post comments');
        throw error;
      }
    }
  );

  // Create comment on post
  app.fastify.post<{ Params: { id: string }; Body: z.infer<typeof createCommentSchema> }>(
    '/api/community/posts/:id/comments',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const paramsObj = request.params as { id: string };
      const id = paramsObj.id;

      const validation = createCommentSchema.safeParse(request.body);
      if (!validation.success) {
        app.logger.warn({ errors: validation.error.issues }, 'Invalid comment data');
        return reply.status(400).send({ error: 'Invalid comment data' });
      }

      app.logger.info({ postId: id, userId: session.user.id, body: request.body }, 'Creating post comment');

      try {
        const post = await app.db
          .select()
          .from(schema.communityPosts)
          .where(eq(schema.communityPosts.id, id))
          .then((rows) => rows[0]);

        if (!post) {
          app.logger.warn({ postId: id }, 'Post not found');
          return reply.status(404).send({ error: 'Post not found' });
        }

        const [comment] = await app.db
          .insert(schema.postComments)
          .values({
            postId: id,
            userId: session.user.id,
            content: validation.data.content,
          })
          .returning();

        // Update comment count
        await app.db
          .update(schema.communityPosts)
          .set({ commentsCount: post.commentsCount + 1 })
          .where(eq(schema.communityPosts.id, id));

        app.logger.info({ commentId: comment.id, postId: id, userId: session.user.id }, 'Post comment created successfully');
        return comment;
      } catch (error) {
        app.logger.error({ err: error, postId: id, userId: session.user.id }, 'Failed to create post comment');
        throw error;
      }
    }
  );
}
