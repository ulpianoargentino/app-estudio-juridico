import { Request, Response, NextFunction } from "express";
import { z } from "zod/v4";
import * as errandService from "../services/errand.service";
import {
  createErrandSchema,
  updateErrandSchema,
  queryErrandSchema,
} from "../validators/errand.validator";

function formatZodError(error: z.ZodError) {
  return {
    code: "VALIDATION_ERROR",
    message: "Datos de entrada inválidos",
    details: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
  };
}

export async function listByCase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = queryErrandSchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const result = await errandService.findByCase(req.firmId!, req.params.caseId as string, parsed.data);
    res.json({ data: result.data, meta: result.meta });
  } catch (err) { next(err); }
}

export async function createForCase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createErrandSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const errand = await errandService.create(
      req.firmId!,
      req.params.caseId as string,
      parsed.data,
      req.user!.userId,
    );
    res.status(201).json({ data: errand });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateErrandSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const errand = await errandService.update(req.firmId!, req.params.id as string, parsed.data, req.user!.userId);
    res.json({ data: errand });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await errandService.remove(req.firmId!, req.params.id as string, req.user!.userId);
    res.json({ data: { message: "Gestión eliminada" } });
  } catch (err) { next(err); }
}
