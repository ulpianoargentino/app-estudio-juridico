import { z } from "zod/v4";
import { documentCategory } from "../models/enums";

const categoryValues = Object.values(documentCategory) as [string, ...string[]];

export const createDocumentSchema = z.object({
  caseId: z.string().nullish(),
  matterId: z.string().nullish(),
  movementId: z.string().nullish(),
  fileName: z.string().min(1, "El nombre del archivo es obligatorio"),
  fileUrl: z.string().min(1, "La URL del archivo es obligatoria"),
  fileSize: z.number().int().min(0, "El tamaño del archivo debe ser positivo"),
  mimeType: z.string().min(1, "El tipo MIME es obligatorio"),
  category: z.enum(categoryValues, { error: "Categoría inválida" }),
  notes: z.string().nullish(),
});

export const queryDocumentSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  caseId: z.string().optional(),
  matterId: z.string().optional(),
  category: z.enum(categoryValues).optional(),
  sort: z.enum(["created_at", "file_name", "file_size"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
