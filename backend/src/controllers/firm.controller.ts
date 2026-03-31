import { Request, Response, NextFunction } from "express";
import { z } from "zod/v4";
import * as firmService from "../services/firm.service";

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

export async function getFirm(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const firm = await firmService.getFirm(req.firmId!);
    res.json({ data: firm });
  } catch (err) {
    next(err);
  }
}

const updateFirmSchema = z.object({
  name: z.string().min(1, "El nombre del estudio es obligatorio").optional(),
  logoUrl: z.string().url("URL inválida").nullish(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido (formato #RRGGBB)")
    .nullish(),
});

export async function updateFirm(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = updateFirmSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }
    const firm = await firmService.updateFirm(req.firmId!, parsed.data);
    res.json({ data: firm });
  } catch (err) {
    next(err);
  }
}
