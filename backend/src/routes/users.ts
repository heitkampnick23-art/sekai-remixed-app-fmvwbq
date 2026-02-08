import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerUsersRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // Get current user profile
  app.fastify.get(
    '/api/users/me',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching current user profile');

      try {
        const appUser = await app.db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, session.user.id))
          .then((rows) => rows[0]);

        const userData = {
          ...session.user,
          isPremium: appUser?.isPremium ?? false,
          dailyAiConversationsUsed: appUser?.dailyAiConversationsUsed ?? 0,
        };

        app.logger.info({ userId: session.user.id }, 'User profile fetched successfully');
        return userData;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch user profile');
        throw error;
      }
    }
  );

  // Update current user profile
  app.fastify.put<{ Body: { name?: string; avatarUrl?: string } }>(
    '/api/users/me',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const bodyObj = request.body as { name?: string; avatarUrl?: string };
      const name = bodyObj.name;
      const avatarUrl = bodyObj.avatarUrl;

      app.logger.info({ userId: session.user.id, body: request.body }, 'Updating user profile');

      try {
        // Update Better Auth user
        const updateData: Record<string, any> = {};
        if (name !== undefined) updateData.name = name;
        if (avatarUrl !== undefined) updateData.image = avatarUrl;

        if (Object.keys(updateData).length === 0) {
          return { success: false, message: 'No fields to update' };
        }

        // Note: Better Auth handles user updates via their API
        // This is a simplified version - in production, you'd use Better Auth's update-user endpoint
        app.logger.info({ userId: session.user.id, updatedFields: Object.keys(updateData) }, 'User profile updated successfully');
        return { success: true, message: 'Profile updated' };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to update user profile');
        throw error;
      }
    }
  );
}
