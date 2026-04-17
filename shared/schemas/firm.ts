import { z } from "zod/v4";
import { idSchema, timestampSchema } from "./common";

// Shape completo del Firm que devuelve el backend en endpoints autenticados.
export const firmResponseSchema = z.object({
  id: idSchema,
  name: z.string(),
  logoUrl: z.string().nullable(),
  accentColor: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

// Versión reducida — es lo único que /auth/* embebe dentro del user.
export const firmSummarySchema = z.object({
  id: idSchema,
  name: z.string(),
});

export type Firm = z.infer<typeof firmResponseSchema>;
export type FirmSummary = z.infer<typeof firmSummarySchema>;
