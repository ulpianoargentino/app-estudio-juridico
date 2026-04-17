// Cuando se implemente el service de portal_credentials, debe llenar
// created_by / updated_by en cada escritura. Siempre lo toca un usuario
// humano (un abogado carga sus propias credenciales de portal), por eso
// ambos campos son NOT NULL.
import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";

export const portalCredentials = pgTable("portal_credentials", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => firms.id),
  userId: text("user_id").notNull().references(() => users.id),
  portal: text("portal").notNull(), // Portal enum
  usernameEncrypted: text("username_encrypted").notNull(),
  passwordEncrypted: text("password_encrypted").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text("updated_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
