import { z } from "zod/v4";

// UUIDv7 generado por el backend. Se trata como string porque z.uuid() valida
// v4 estricto en algunas versiones y rompe con v7.
export const idSchema = z.string().min(1);

// Fechas que viajan en JSON: ISO 8601 con timezone (ej. "2026-04-17T12:34:56.000-03:00").
export const timestampSchema = z.string().datetime({ offset: true });

// Campos de auditoría que el backend agrega a cada entidad de negocio.
export const auditFieldsSchema = z.object({
  createdBy: idSchema,
  createdAt: timestampSchema,
  updatedBy: idSchema,
  updatedAt: timestampSchema,
});
export type AuditFields = z.infer<typeof auditFieldsSchema>;

// Metadata de paginación que devuelven los endpoints de listado.
export const paginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

// Factory para envelopes de listado paginado: { data, meta }
// Ver case.service / matter.service: el backend devuelve este shape exacto.
export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    meta: paginationMetaSchema,
  });
}

// Query params comunes para listados paginados.
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Formato de error que devuelve el middleware error-handler del backend.
// Incluye `details` opcional con errores de validación por campo.
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z
      .array(
        z.object({
          field: z.string(),
          message: z.string(),
        })
      )
      .optional(),
  }),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// Coerción auxiliar para query params booleanos enviados como "true"/"false".
export const booleanQueryParam = z
  .enum(["true", "false"])
  .transform((v) => v === "true");
