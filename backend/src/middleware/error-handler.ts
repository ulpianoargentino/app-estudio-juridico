import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../utils/errors";
import { config } from "../config";
import type { ApiErrorResponse } from "../types";

function isPostgresError(err: unknown): err is { code: string; detail?: string; table?: string; constraint?: string } {
  return typeof err === "object" && err !== null && "code" in err && typeof (err as Record<string, unknown>).code === "string" && (err as Record<string, unknown>).code?.toString().length === 5;
}

export function errorHandler(
  err: Error & { type?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. AppError (includes all subclasses: NotFoundError, ValidationError, etc.)
  if (err instanceof ValidationError) {
    const body: ApiErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof AppError) {
    const body: ApiErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // 2. Zod validation errors (from safeParse failures passed through)
  if (err.name === "ZodError" && "issues" in err) {
    const zodErr = err as Error & { issues: Array<{ path: (string | number)[]; message: string }> };
    const details = zodErr.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    const body: ApiErrorResponse = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Datos de entrada inválidos",
        details,
      },
    };
    res.status(400).json(body);
    return;
  }

  // 3. JSON parse errors (malformed request body)
  if (err.type === "entity.parse.failed" || err.message?.includes("JSON")) {
    const body: ApiErrorResponse = {
      error: {
        code: "INVALID_JSON",
        message: "El cuerpo de la solicitud no es JSON válido",
      },
    };
    res.status(400).json(body);
    return;
  }

  // 4. Request too large
  if (err.type === "entity.too.large") {
    const body: ApiErrorResponse = {
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "El cuerpo de la solicitud excede el tamaño máximo permitido",
      },
    };
    res.status(413).json(body);
    return;
  }

  // 5. PostgreSQL / Drizzle database errors — log but don't expose details
  if (isPostgresError(err)) {
    console.error("Database error:", {
      code: err.code,
      detail: err.detail,
      table: err.table,
      constraint: err.constraint,
      stack: (err as Error).stack,
    });

    // Unique constraint violation
    if (err.code === "23505") {
      const body: ApiErrorResponse = {
        error: {
          code: "DUPLICATE_ENTRY",
          message: "Ya existe un registro con esos datos",
        },
      };
      res.status(409).json(body);
      return;
    }

    // Foreign key violation
    if (err.code === "23503") {
      const body: ApiErrorResponse = {
        error: {
          code: "REFERENCE_ERROR",
          message: "El registro referenciado no existe o no se puede eliminar por tener dependencias",
        },
      };
      res.status(400).json(body);
      return;
    }

    const body: ApiErrorResponse = {
      error: {
        code: "DATABASE_ERROR",
        message: "Error interno del servidor",
      },
    };
    res.status(500).json(body);
    return;
  }

  // 6. JWT errors (expired, malformed, etc.)
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    const body: ApiErrorResponse = {
      error: {
        code: "UNAUTHORIZED",
        message: err.name === "TokenExpiredError"
          ? "La sesión ha expirado, por favor ingresá nuevamente"
          : "No autenticado",
      },
    };
    res.status(401).json(body);
    return;
  }

  // 7. Catch-all for unexpected errors
  console.error("Unhandled error:", err.stack || err);

  const body: ApiErrorResponse = {
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: config.nodeEnv === "production"
        ? "Error interno del servidor"
        : err.message || "Error interno del servidor",
    },
  };
  res.status(500).json(body);
}
