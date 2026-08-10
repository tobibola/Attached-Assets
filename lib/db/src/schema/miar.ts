import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const storiesTable = pgTable("miar_stories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  context: text("context").notNull().default(""),
  color: text("color").notNull(),
  readAll: boolean("read_all").notNull().default(true),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messagesTable = pgTable("miar_messages", {
  id: text("id").primaryKey(),
  storyId: text("story_id").notNull().references(() => storiesTable.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  text: text("text").notNull(),
  attachments: text("attachments").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const memoryTable = pgTable("miar_memory", {
  id: text("id").primaryKey(),
  storyId: text("story_id").references(() => storiesTable.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settingsTable = pgTable("miar_settings", {
  id: integer("id").primaryKey().default(1),
  theme: text("theme").notNull().default("system"),
  voiceSpeed: real("voice_speed").notNull().default(1),
  providers: jsonb("providers").$type<Array<{
    name: "Gemini" | "Groq" | "Mistral" | "OpenRouter";
    model: string;
    enabled: boolean;
    connected: boolean;
  }>>().notNull().default([]),
});

export const insertStorySchema = createInsertSchema(storiesTable).omit({ createdAt: true });
export const insertMessageSchema = createInsertSchema(messagesTable).omit({ createdAt: true });
export const insertMemorySchema = createInsertSchema(memoryTable).omit({ createdAt: true });
export const insertSettingsSchema = createInsertSchema(settingsTable);

export type Story = z.infer<typeof insertStorySchema> & { createdAt: Date };
export type Message = z.infer<typeof insertMessageSchema> & { createdAt: Date };
export type MemoryEntry = z.infer<typeof insertMemorySchema> & { createdAt: Date };
export type Settings = z.infer<typeof insertSettingsSchema>;