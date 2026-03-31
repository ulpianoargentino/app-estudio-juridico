import { pgTable, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { portalCredentials } from "./portal-credentials";

export const syncLogs = pgTable("sync_logs", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => firms.id),
  credentialId: text("credential_id").notNull().references(() => portalCredentials.id),
  portal: text("portal").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  success: boolean("success"),
  casesScraped: integer("cases_scraped").default(0),
  newMovementsFound: integer("new_movements_found").default(0),
  errorMessage: text("error_message"),
});
