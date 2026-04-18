import { pgTable, text, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";
import { persons } from "./persons";
import { courts } from "./courts";

export const cases = pgTable("cases", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => firms.id),
  caseNumber: text("case_number"),
  caseTitle: text("case_title").notNull(),
  jurisdictionType: text("jurisdiction_type").notNull(), // JurisdictionType enum
  jurisdiction: text("jurisdiction"),
  courtId: text("court_id").references(() => courts.id),
  processType: text("process_type"),
  status: text("status").notNull(), // CaseStatus enum
  primaryClientId: text("primary_client_id").references(() => persons.id),
  responsibleAttorneyId: text("responsible_attorney_id").references(() => users.id),
  startDate: timestamp("start_date", { withTimezone: true }),
  claimedAmount: numeric("claimed_amount"),
  currency: text("currency").default("ARS"),
  portalUrl: text("portal_url"),
  notes: text("notes"),
  // Sub-expediente. El discriminador "es sub" sigue siendo el vínculo en
  // case_links (linkType = SUB_CASE). subCaseType y subCaseNumber son ambos
  // OPCIONALES y de texto libre — el frontend sugiere prefijos (A/I/X) según
  // el tipo, pero el usuario puede aceptar, editar o dejar vacío.
  subCaseType: text("sub_case_type"), // SubCaseType enum (EVIDENCE/INCIDENT/OTHER) — nullable
  subCaseNumber: text("sub_case_number"), // texto libre, nullable. Se concatena con padre.case_number en UI.
  subCaseDescription: text("sub_case_description"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text("updated_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
