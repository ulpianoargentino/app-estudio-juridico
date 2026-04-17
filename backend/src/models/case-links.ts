// Cuando se implemente el service de case_links, debe llenar
// created_by / updated_by en cada escritura. Siempre lo toca un
// usuario humano (un abogado vincula expedientes relacionados),
// por eso ambos campos son NOT NULL.
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
  updatedBy: text("updated_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
