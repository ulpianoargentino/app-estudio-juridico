import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";
import { cases } from "./cases";

export const errands = pgTable("errands", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => firms.id),
  caseId: text("case_id").notNull().references(() => cases.id),
  errandType: text("errand_type").notNull(), // ErrandType enum
  status: text("status").notNull(), // ErrandStatus enum
  responsibleId: text("responsible_id").references(() => users.id),
  dueDate: timestamp("due_date", { withTimezone: true }),
  completedDate: timestamp("completed_date", { withTimezone: true }),
  notes: text("notes"),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text("updated_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
