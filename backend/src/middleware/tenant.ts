import { Request, Response, NextFunction } from "express";
import { AppError } from "./error-handler";

// Extracts firmId from the authenticated user and attaches it to the request.
// Every data query MUST filter by req.user.firmId.
export function tenantMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }

  if (!req.user.firmId) {
    throw new AppError(
      403,
      "TENANT_MISSING",
      "User is not associated with a firm"
    );
  }

  // firmId is already on req.user, available to all downstream handlers.
  // Controllers MUST use req.user.firmId in every database query.
  next();
}
