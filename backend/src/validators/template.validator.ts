import { z } from "zod/v4";

export const createTemplateSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  category: z.string().min(1, "La categoria es obligatoria"),
  content: z.string().min(1, "El contenido es obligatorio"),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").optional(),
  category: z.string().min(1, "La categoria es obligatoria").optional(),
  content: z.string().min(1, "El contenido es obligatorio").optional(),
});

export const queryTemplateSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
});

export const renderTemplateSchema = z.object({
  caseId: z.string().min(1, "El expediente es obligatorio"),
});
