import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";
import { cases } from "./cases";
import { matters } from "./matters";
import { movements } from "./movements";

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => firms.id),
  caseId: text("case_id").references(() => cases.id),
  matterId: text("matter_id").references(() => matters.id),
  movementId: text("movement_id").references(() => movements.id),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  category: text("category").notNull(), // DocumentCategory enum
  notes: text("notes"),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text("updated_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
