import { pgTable, text, timestamp, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { firms } from "./firms";
import { users } from "./users";
import { persons } from "./persons";
import { cases } from "./cases";
import { matters } from "./matters";

export const parties = pgTable(
  "parties",
  {
    id: text("id").primaryKey(),
    firmId: text("firm_id").notNull().references(() => firms.id),
    personId: text("person_id").notNull().references(() => persons.id),
    caseId: text("case_id").references(() => cases.id),
    matterId: text("matter_id").references(() => matters.id),
    role: text("role").notNull(), // PartyRole enum
    notes: text("notes"),
    createdBy: text("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull().references(() => users.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Exactamente uno de case_id o matter_id debe ser NOT NULL
    check(
      "parties_case_or_matter",
      sql`(${table.caseId} IS NOT NULL AND ${table.matterId} IS NULL) OR (${table.caseId} IS NULL AND ${table.matterId} IS NOT NULL)`
    ),
  ]
);
