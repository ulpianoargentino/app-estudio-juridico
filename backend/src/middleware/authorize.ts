import { Request, Response, NextFunction } from "express";
import type { UserRole } from "../models/enums";

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "No autenticado" },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "No tenés permisos para esta acción",
        },
      });
      return;
    }

    next();
  };
}
