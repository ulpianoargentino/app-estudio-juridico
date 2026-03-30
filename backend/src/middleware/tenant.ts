import { Request, Response, NextFunction } from "express";

// Extracts firmId from the authenticated user and attaches it to the request
// for downstream use. Every database query MUST filter by this firmId.
export function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || !req.user.firmId) {
    res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message: "No firm context found for authenticated user",
      },
    });
    return;
  }

  // firmId is already available via req.user.firmId
  // All service/repository calls must use req.user.firmId to enforce tenant isolation
  next();
}
