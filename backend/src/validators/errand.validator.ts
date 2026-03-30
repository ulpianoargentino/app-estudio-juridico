import { z } from "zod/v4";
import { errandType, errandStatus } from "../models/enums";

const errandTypeValues = Object.values(errandType) as [string, ...string[]];
const errandStatusValues = Object.values(errandStatus) as [string, ...string[]];

export const createErrandSchema = z.object({
  errandType: z.enum(errandTypeValues, { error: "Tipo de gestión inválido" }),
  status: z.enum(errandStatusValues, { error: "Estado inválido" }).default("PENDING"),
  responsibleId: z.string().nullish(),
  dueDate: z.coerce.date().nullish(),
  notes: z.string().nullish(),
  createEvent: z.boolean().default(false),
});

export const updateErrandSchema = z.object({
  errandType: z.enum(errandTypeValues, { error: "Tipo de gestión inválido" }).optional(),
  status: z.enum(errandStatusValues, { error: "Estado inválido" }).optional(),
  responsibleId: z.string().nullish(),
  dueDate: z.coerce.date().nullish(),
  notes: z.string().nullish(),
});

export const queryErrandSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  errandType: z.enum(errandTypeValues).optional(),
  status: z.enum(errandStatusValues).optional(),
  sort: z.enum(["due_date", "created_at"]).default("due_date"),
  order: z.enum(["asc", "desc"]).default("asc"),
});
