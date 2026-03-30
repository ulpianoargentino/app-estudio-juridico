import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => firms.id),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  notificationType: text("notification_type").notNull(), // NotificationType enum
  referenceType: text("reference_type"), // 'case' | 'matter' | 'event'
  referenceId: text("reference_id"),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
