import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";
import { cases } from "./cases";
import { matters } from "./matters";

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => firms.id),
  caseId: text("case_id").references(() => cases.id),
  matterId: text("matter_id").references(() => matters.id),
  eventType: text("event_type").notNull(), // EventType enum
  title: text("title").notNull(),
  description: text("description"),
  eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
  eventTime: text("event_time"),
  endDate: timestamp("end_date", { withTimezone: true }),
  endTime: text("end_time"),
  isAllDay: boolean("is_all_day").notNull().default(false),
  assignedToId: text("assigned_to_id").references(() => users.id),
  status: text("status").notNull(), // EventStatus enum
  reminderMinutesBefore: integer("reminder_minutes_before").default(60),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text("updated_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
