import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import { loginRequestSchema, registerRequestSchema } from "@shared";
import { formatZodError } from "../utils/zod-error";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = registerRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const user = await authService.register(parsed.data, res);
    res.status(201).json({ data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = loginRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const user = await authService.login(parsed.data.email, parsed.data.password, res);
    res.status(200).json({ data: { user } });
  } catch (err) {
    next(err);
  }
}

export function logout(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    authService.logout(res);
    res.status(200).json({ data: { message: "Sesión cerrada" } });
  } catch (err) {
    next(err);
  }
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await authService.getCurrentUser(req.user!.userId);
    res.status(200).json({ data: { user } });
  } catch (err) {
    next(err);
  }
}
