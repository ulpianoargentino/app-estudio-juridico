import { z } from "zod/v4";

interface ZodIssue {
  path: (string | number)[];
  message: string;
}

export function formatZodError(error: z.ZodError): {
  code: string;
  message: string;
  details: Array<{ field: string; message: string }>;
} {
  return {
    code: "VALIDATION_ERROR",
    message: "Datos de entrada inválidos",
    details: (error.issues as ZodIssue[]).map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  };
}
