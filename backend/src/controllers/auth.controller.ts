import { Request, Response, NextFunction } from "express";
import { z } from "zod/v4";
import * as authService from "../services/auth.service";

const registerSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  firmName: z.string().min(1, "El nombre del estudio es obligatorio"),
});

const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

function formatZodError(error: z.ZodError): {
  code: string;
  message: string;
  details: Array<{ field: string; message: string }>;
} {
  const details = error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
  return {
    code: "VALIDATION_ERROR",
    message: "Datos de entrada inválidos",
    details,
  };
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body);
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
    const parsed = loginSchema.safeParse(req.body);
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

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es obligatoria"),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
});

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }
    await authService.changePassword(
      req.user!.userId,
      parsed.data.currentPassword,
      parsed.data.newPassword
    );
    res.json({ data: { message: "Contraseña actualizada" } });
  } catch (err) {
    next(err);
  }
}

const updateProfileSchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio").optional(),
  lastName: z.string().min(1, "El apellido es obligatorio").optional(),
});

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }
    const user = await authService.updateProfile(req.user!.userId, parsed.data);
    res.json({ data: { user } });
  } catch (err) {
    next(err);
  }
}
