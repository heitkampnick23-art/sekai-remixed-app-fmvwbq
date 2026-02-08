import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema.js';
import * as authSchema from './db/auth-schema.js';
import { registerUsersRoutes } from './routes/users.js';
import { registerCharacterRoutes } from './routes/characters.js';
import { registerStoryRoutes } from './routes/stories.js';
import { registerConversationRoutes } from './routes/conversations.js';
import { registerCommunityRoutes } from './routes/community.js';
import { registerSocialRoutes } from './routes/social.js';
import { registerAiRoutes } from './routes/ai.js';

// Combine schemas
const schema = { ...appSchema, ...authSchema };

// Create application with combined schema
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable authentication
app.withAuth();

// Register all routes
registerUsersRoutes(app);
registerCharacterRoutes(app);
registerStoryRoutes(app);
registerConversationRoutes(app);
registerCommunityRoutes(app);
registerSocialRoutes(app);
registerAiRoutes(app);

await app.run();
app.logger.info('Application running');
