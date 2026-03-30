import { Request, Response, NextFunction } from "express";
import { AuthenticatedUser } from "../types";

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// TODO: Implement JWT validation or session-based auth.
// For now this is a stub that rejects all requests.
export function authMiddleware(
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // TODO: Extract token from Authorization header, validate it,
  // and attach the authenticated user to req.user.
  res.status(401).json({
    error: {
      code: "UNAUTHORIZED",
      message: "Authentication required",
    },
  });
}
