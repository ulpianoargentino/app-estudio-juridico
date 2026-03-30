import { pgTable, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";

export const templates = pgTable("templates", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => firms.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  variables: jsonb("variables").$type<string[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text("updated_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
