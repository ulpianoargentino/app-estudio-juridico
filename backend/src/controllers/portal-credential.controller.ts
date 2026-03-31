import { Request, Response, NextFunction } from "express";
import { z } from "zod/v4";
import * as portalCredentialService from "../services/portal-credential.service";
import {
  createPortalCredentialSchema,
  updatePortalCredentialSchema,
  toggleActiveSchema,
} from "../validators/portal-credential.validator";
import type { Portal } from "../models/enums";

function formatZodError(error: z.ZodError) {
  return {
    code: "VALIDATION_ERROR",
    message: "Datos de entrada inválidos",
    details: error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    })),
  };
}

export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await portalCredentialService.findAllByFirm(req.firmId!);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await portalCredentialService.findById(
      req.firmId!,
      req.params.id as string
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createPortalCredentialSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }
    const data = await portalCredentialService.create(
      req.firmId!,
      req.user!.userId,
      { ...parsed.data, portal: parsed.data.portal as Portal }
    );
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = updatePortalCredentialSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }
    const data = await portalCredentialService.update(
      req.firmId!,
      req.params.id as string,
      parsed.data as { portal?: Portal; username?: string; password?: string }
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function toggleActive(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = toggleActiveSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }
    const data = await portalCredentialService.toggleActive(
      req.firmId!,
      req.params.id as string,
      parsed.data.isActive
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await portalCredentialService.remove(
      req.firmId!,
      req.params.id as string
    );
    res.json({ data: { message: "Credencial eliminada" } });
  } catch (err) {
    next(err);
  }
}
