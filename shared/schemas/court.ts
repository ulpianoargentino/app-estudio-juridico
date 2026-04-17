import { z } from "zod/v4";
import { idSchema, auditFieldsSchema, paginationQuerySchema } from "./common";

export const courtCreateSchema = z.object({
  name: z.string().min(1, "El nombre del juzgado es obligatorio"),
  courtType: z.string().min(1, "El tipo de juzgado es obligatorio"),
  jurisdiction: z.string().min(1, "La jurisdicción es obligatoria"),
  address: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.email("Email inválido").nullish(),
  notes: z.string().nullish(),
});
export type CourtCreateInput = z.infer<typeof courtCreateSchema>;

export const courtUpdateSchema = z.object({
  name: z.string().min(1, "El nombre del juzgado es obligatorio").optional(),
  courtType: z.string().min(1).optional(),
  jurisdiction: z.string().min(1).optional(),
  address: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.email("Email inválido").nullish(),
  notes: z.string().nullish(),
});
export type CourtUpdateInput = z.infer<typeof courtUpdateSchema>;

export const courtQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  sort: z.enum(["name", "jurisdiction", "created_at"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});
export type CourtQuery = z.infer<typeof courtQuerySchema>;

export const courtResponseSchema = z.object({
  id: idSchema,
  firmId: idSchema,
  name: z.string(),
  courtType: z.string(),
  jurisdiction: z.string(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  notes: z.string().nullable(),
  isActive: z.boolean(),
  ...auditFieldsSchema.shape,
});
export type Court = z.infer<typeof courtResponseSchema>;
