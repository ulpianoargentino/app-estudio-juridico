import { z } from "zod/v4";
import type { ErrorResponse } from "@shared";

// Convierte un ZodError en el payload que el front-end espera como
// response.error (ver errorResponseSchema en shared/schemas/common.ts).
export function formatZodError(error: z.ZodError): ErrorResponse["error"] {
  return {
    code: "VALIDATION_ERROR",
    message: "Datos de entrada inválidos",
    details: error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  };
}
