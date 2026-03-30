import { Request, Response, NextFunction } from "express";

export function firmContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "No autenticado" },
    });
    return;
  }

  if (!req.user.firmId) {
    res.status(403).json({
      error: {
        code: "TENANT_MISSING",
        message: "Usuario no asociado a un estudio",
      },
    });
    return;
  }

  req.firmId = req.user.firmId;
  next();
}
