import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import type { UserRole } from "../models/enums";

interface JwtPayload {
  userId: string;
  firmId: string;
  role: UserRole;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "No autenticado" },
    });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = {
      userId: payload.userId,
      firmId: payload.firmId,
      role: payload.role,
    };
    next();
  } catch (err) {
    const isExpired = err instanceof jwt.TokenExpiredError;
    res.status(401).json({
      error: {
        code: isExpired ? "TOKEN_EXPIRED" : "UNAUTHORIZED",
        message: isExpired
          ? "La sesión ha expirado, por favor ingresá nuevamente"
          : "No autenticado",
      },
    });
  }
}
