import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerSocialRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // Toggle follow user
  app.fastify.post<{ Params: { userId: string } }>(
    '/api/social/follow/:userId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const paramsObj = request.params as { userId: string };
      const userId = paramsObj.userId;

      app.logger.info({ followerId: session.user.id, followingId: userId }, 'Toggling follow');

      try {
        if (userId === session.user.id) {
          app.logger.warn({ userId: session.user.id }, 'Cannot follow yourself');
          return reply.status(400).send({ error: 'Cannot follow yourself' });
        }

        // Check if already following
        const existing = await app.db
          .select()
          .from(schema.followers)
          .where(
            and(
              eq(schema.followers.followerId, session.user.id),
              eq(schema.followers.followingId, userId)
            )
          )
          .then((rows) => rows[0]);

        if (existing) {
          // Unfollow
          await app.db
            .delete(schema.followers)
            .where(
              and(
                eq(schema.followers.followerId, session.user.id),
                eq(schema.followers.followingId, userId)
              )
            );

          app.logger.info({ followerId: session.user.id, followingId: userId }, 'Unfollowed successfully');
          return { success: true, following: false };
        } else {
          // Follow
          await app.db.insert(schema.followers).values({
            followerId: session.user.id,
            followingId: userId,
          });

          app.logger.info({ followerId: session.user.id, followingId: userId }, 'Followed successfully');
          return { success: true, following: true };
        }
      } catch (error) {
        app.logger.error({ err: error, followerId: session.user.id, followingId: userId }, 'Failed to toggle follow');
        throw error;
      }
    }
  );

  // Get followers of a user
  app.fastify.get<{ Params: { userId: string }; Querystring: { limit?: string; offset?: string } }>(
    '/api/social/followers/:userId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const paramsObj = request.params as { userId: string };
      const userId = paramsObj.userId;
      const queryObj = request.query as { limit?: string; offset?: string };
      const limit = queryObj.limit || '20';
      const offset = queryObj.offset || '0';

      app.logger.info({ userId, limit, offset }, 'Fetching followers');

      try {
        const limitNum = Math.min(parseInt(limit), 100);
        const offsetNum = parseInt(offset);

        const followersList = await app.db
          .select()
          .from(schema.followers)
          .where(eq(schema.followers.followingId, userId))
          .limit(limitNum)
          .offset(offsetNum);

        app.logger.info({ userId, count: followersList.length }, 'Followers fetched successfully');
        return followersList;
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to fetch followers');
        throw error;
      }
    }
  );

  // Get users followed by a user
  app.fastify.get<{ Params: { userId: string }; Querystring: { limit?: string; offset?: string } }>(
    '/api/social/following/:userId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const paramsObj = request.params as { userId: string };
      const userId = paramsObj.userId;
      const queryObj = request.query as { limit?: string; offset?: string };
      const limit = queryObj.limit || '20';
      const offset = queryObj.offset || '0';

      app.logger.info({ userId, limit, offset }, 'Fetching following');

      try {
        const limitNum = Math.min(parseInt(limit), 100);
        const offsetNum = parseInt(offset);

        const followingList = await app.db
          .select()
          .from(schema.followers)
          .where(eq(schema.followers.followerId, userId))
          .limit(limitNum)
          .offset(offsetNum);

        app.logger.info({ userId, count: followingList.length }, 'Following fetched successfully');
        return followingList;
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to fetch following');
        throw error;
      }
    }
  );
}
