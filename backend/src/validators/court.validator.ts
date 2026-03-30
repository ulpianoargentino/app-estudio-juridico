import { z } from "zod/v4";

export const createCourtSchema = z.object({
  name: z.string().min(1, "El nombre del juzgado es obligatorio"),
  courtType: z.string().min(1, "El tipo de juzgado es obligatorio"),
  jurisdiction: z.string().min(1, "La jurisdicción es obligatoria"),
  address: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.email("Email inválido").nullish(),
  notes: z.string().nullish(),
});

export const updateCourtSchema = z.object({
  name: z.string().min(1, "El nombre del juzgado es obligatorio").optional(),
  courtType: z.string().min(1).optional(),
  jurisdiction: z.string().min(1).optional(),
  address: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.email("Email inválido").nullish(),
  notes: z.string().nullish(),
});

export const queryCourtSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort: z.enum(["name", "jurisdiction", "created_at"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});
