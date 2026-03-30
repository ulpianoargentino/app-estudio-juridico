import { pgTable, text, timestamp, integer, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { firms } from "./firms";
import { users } from "./users";
import { cases } from "./cases";
import { matters } from "./matters";

export const movements = pgTable(
  "movements",
  {
    id: text("id").primaryKey(),
    firmId: text("firm_id").notNull().references(() => firms.id),
    caseId: text("case_id").references(() => cases.id),
    matterId: text("matter_id").references(() => matters.id),
    movementDate: timestamp("movement_date", { withTimezone: true }).notNull(),
    movementType: text("movement_type").notNull(),
    description: text("description").notNull(),
    volume: text("volume"),
    folio: integer("folio"),
    documentUrl: text("document_url"),
    createdBy: text("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull().references(() => users.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Exactamente uno de case_id o matter_id debe ser NOT NULL
    check(
      "movements_case_or_matter",
      sql`(${table.caseId} IS NOT NULL AND ${table.matterId} IS NULL) OR (${table.caseId} IS NULL AND ${table.matterId} IS NOT NULL)`
    ),
  ]
);
