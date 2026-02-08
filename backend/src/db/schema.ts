import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth-schema.js';

// Users table - extends Better Auth user with app-specific fields
export const users = pgTable(
  'app_users',
  {
    id: text('id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
    isPremium: boolean('is_premium').default(false).notNull(),
    dailyAiConversationsUsed: integer('daily_ai_conversations_used').default(0).notNull(),
    lastConversationReset: timestamp('last_conversation_reset', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('users_created_at_idx').on(table.createdAt),
  ]
);

// Characters table
export const characters = pgTable(
  'characters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').notNull(),
    personality: text('personality').notNull(),
    backstory: text('backstory').notNull(),
    avatarUrl: text('avatar_url'),
    style: text('style').notNull(),
    isPublic: boolean('is_public').default(false).notNull(),
    likesCount: integer('likes_count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('characters_user_id_idx').on(table.userId),
    index('characters_is_public_idx').on(table.isPublic),
    index('characters_style_idx').on(table.style),
    index('characters_created_at_idx').on(table.createdAt),
  ]
);

// Stories table
export const stories = pgTable(
  'stories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    characterId: uuid('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    genre: text('genre').notNull(),
    content: jsonb('content').notNull(),
    isPublic: boolean('is_public').default(false).notNull(),
    isPrivate: boolean('is_private').default(false).notNull(),
    likesCount: integer('likes_count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('stories_user_id_idx').on(table.userId),
    index('stories_character_id_idx').on(table.characterId),
    index('stories_genre_idx').on(table.genre),
    index('stories_is_public_idx').on(table.isPublic),
    index('stories_created_at_idx').on(table.createdAt),
  ]
);

// Conversations table
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    characterId: uuid('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
    storyId: uuid('story_id').references(() => stories.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    messages: jsonb('messages').notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (table) => [
    index('conversations_user_id_idx').on(table.userId),
    index('conversations_character_id_idx').on(table.characterId),
    index('conversations_story_id_idx').on(table.storyId),
    index('conversations_created_at_idx').on(table.createdAt),
  ]
);

// Community posts table
export const communityPosts = pgTable(
  'community_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    contentType: text('content_type').notNull(),
    contentId: uuid('content_id').notNull(),
    caption: text('caption'),
    likesCount: integer('likes_count').default(0).notNull(),
    commentsCount: integer('comments_count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('community_posts_user_id_idx').on(table.userId),
    index('community_posts_content_type_idx').on(table.contentType),
    index('community_posts_created_at_idx').on(table.createdAt),
  ]
);

// Post comments table
export const postComments = pgTable(
  'post_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('post_comments_post_id_idx').on(table.postId),
    index('post_comments_user_id_idx').on(table.userId),
    index('post_comments_created_at_idx').on(table.createdAt),
  ]
);

// Followers table
export const followers = pgTable(
  'followers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    followerId: text('follower_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    followingId: text('following_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('followers_unique_idx').on(table.followerId, table.followingId),
    index('followers_follower_id_idx').on(table.followerId),
    index('followers_following_id_idx').on(table.followingId),
  ]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  characters: many(characters),
  stories: many(stories),
  conversations: many(conversations),
  communityPosts: many(communityPosts),
  comments: many(postComments),
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, {
    fields: [characters.userId],
    references: [users.id],
  }),
  stories: many(stories),
  conversations: many(conversations),
}));

export const storiesRelations = relations(stories, ({ one, many }) => ({
  user: one(users, {
    fields: [stories.userId],
    references: [users.id],
  }),
  character: one(characters, {
    fields: [stories.characterId],
    references: [characters.id],
  }),
  conversations: many(conversations),
}));

export const conversationsRelations = relations(conversations, ({ one }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  character: one(characters, {
    fields: [conversations.characterId],
    references: [characters.id],
  }),
  story: one(stories, {
    fields: [conversations.storyId],
    references: [stories.id],
  }),
}));

export const communityPostsRelations = relations(communityPosts, ({ one, many }) => ({
  user: one(users, {
    fields: [communityPosts.userId],
    references: [users.id],
  }),
  comments: many(postComments),
}));

export const postCommentsRelations = relations(postComments, ({ one }) => ({
  post: one(communityPosts, {
    fields: [postComments.postId],
    references: [communityPosts.id],
  }),
  user: one(users, {
    fields: [postComments.userId],
    references: [users.id],
  }),
}));

export const followersRelations = relations(followers, ({ one }) => ({
  follower: one(users, {
    fields: [followers.followerId],
    references: [users.id],
  }),
  following: one(users, {
    fields: [followers.followingId],
    references: [users.id],
  }),
}));
