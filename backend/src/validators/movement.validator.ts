import { z } from "zod/v4";

export const createMovementSchema = z.object({
  movementDate: z.coerce.date({ error: "Fecha de movimiento inválida" }),
  movementType: z.string().min(1, "El tipo de movimiento es obligatorio"),
  description: z.string().min(1, "La descripción es obligatoria"),
  volume: z.string().nullish(),
  folio: z.coerce.number().int().positive("La foja debe ser un número positivo").nullish(),
  documentUrl: z.string().url("URL inválida").nullish(),
});

export const updateMovementSchema = z.object({
  movementDate: z.coerce.date({ error: "Fecha de movimiento inválida" }).optional(),
  movementType: z.string().min(1, "El tipo de movimiento es obligatorio").optional(),
  description: z.string().min(1, "La descripción es obligatoria").optional(),
  volume: z.string().nullish(),
  folio: z.coerce.number().int().positive("La foja debe ser un número positivo").nullish(),
  documentUrl: z.string().url("URL inválida").nullish(),
});

export const queryMovementSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  movementType: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sort: z.enum(["movement_date", "created_at"]).default("movement_date"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
