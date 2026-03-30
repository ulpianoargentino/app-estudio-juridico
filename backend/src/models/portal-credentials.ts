import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";

export const portalCredentials = pgTable("portal_credentials", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => firms.id),
  userId: text("user_id").notNull().references(() => users.id),
  portal: text("portal").notNull(), // Portal enum
  usernameEncrypted: text("username_encrypted").notNull(),
  passwordEncrypted: text("password_encrypted").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
