import { z } from "zod/v4";
import { idSchema, timestampSchema } from "./common";
import { userRole, enumValues } from "./enums";
import { firmSummarySchema } from "./firm";

// User completo como lo ve el backend (NO incluye passwordHash).
// Este schema describe un registro "interno": la API pública expone usuarios
// vía /auth/me con firm embebido (ver authUserSchema).
export const userResponseSchema = z.object({
  id: idSchema,
  firmId: idSchema,
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(enumValues(userRole)),
  isActive: z.boolean(),
  lastLoginAt: timestampSchema.nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type User = z.infer<typeof userResponseSchema>;

// Shape que devuelven /auth/login, /auth/register y /auth/me: user con firm anidado.
// Coincide con UserResponse en backend/src/services/auth.service.ts::formatUser.
export const authUserSchema = z.object({
  id: idSchema,
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(enumValues(userRole)),
  firm: firmSummarySchema,
});
export type AuthUser = z.infer<typeof authUserSchema>;
