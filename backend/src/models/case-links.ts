import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";
import { cases } from "./cases";

export const caseLinks = pgTable("case_links", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => firms.id),
  caseId1: text("case_id_1").notNull().references(() => cases.id),
  caseId2: text("case_id_2").notNull().references(() => cases.id),
  linkType: text("link_type").notNull(), // CaseLinkType enum
  notes: text("notes"),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
