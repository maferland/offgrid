import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const auth = pgTable("auth", {
  id: integer().primaryKey().default(1),
  accessToken: text("access_token").notNull(),
  userId: text("user_id").notNull(),
  username: text().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const scheduledStories = pgTable("scheduled_stories", {
  id: text().primaryKey(),
  blobUrl: text("blob_url").notNull(),
  caption: text(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: text().notNull().default("pending"),
  storyId: text("story_id"),
  error: text(),
  position: integer().notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const seenMentions = pgTable("seen_mentions", {
  mentionId: text("mention_id").primaryKey(),
  action: text().notNull(),
  seenAt: timestamp("seen_at").defaultNow(),
});

export const settings = pgTable("settings", {
  key: text().primaryKey(),
  value: text().notNull(),
});
