// Centralized error classes for the application.
// All business errors should use AppError or a subclass.

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(code: string, message: string) {
    super(404, code, message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  public readonly details: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    details: Array<{ field: string; message: string }> = []
  ) {
    super(400, "VALIDATION_ERROR", message);
    this.name = "ValidationError";
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "No autenticado") {
    super(401, "UNAUTHORIZED", message);
    this.name = "AuthenticationError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "No tenés permisos para esta acción") {
    super(403, "FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends AppError {
  constructor(code: string, message: string) {
    super(409, code, message);
    this.name = "ConflictError";
  }
}
