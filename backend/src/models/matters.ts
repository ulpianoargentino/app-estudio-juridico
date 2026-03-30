import { pgTable, text, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";
import { persons } from "./persons";
import { cases } from "./cases";

export const matters = pgTable("matters", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => firms.id),
  title: text("title").notNull(),
  matterType: text("matter_type").notNull(), // MatterType enum
  status: text("status").notNull(), // MatterStatus enum
  primaryClientId: text("primary_client_id").references(() => persons.id),
  opposingPartyId: text("opposing_party_id").references(() => persons.id),
  responsibleAttorneyId: text("responsible_attorney_id").references(() => users.id),
  startDate: timestamp("start_date", { withTimezone: true }),
  estimatedFee: numeric("estimated_fee"),
  currency: text("currency").default("ARS"),
  notes: text("notes"),
  convertedToCaseId: text("converted_to_case_id").references(() => cases.id),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text("updated_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
