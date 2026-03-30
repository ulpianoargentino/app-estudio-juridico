import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";

export const courts = pgTable("courts", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => firms.id),
  name: text("name").notNull(),
  courtType: text("court_type").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text("updated_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
