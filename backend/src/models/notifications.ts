// Cuando se implemente el service de notifications, debe llenar
// created_by / updated_by en cada escritura manual. Ambos campos
// permiten null para notificaciones generadas por procesos automáticos
// (scraper de portales, jobs, etc.) que no tienen usuario humano detrás.
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
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
