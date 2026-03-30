import { Request, Response, NextFunction } from "express";
import { z } from "zod/v4";
import * as movementService from "../services/movement.service";
import {
  createMovementSchema,
  updateMovementSchema,
  queryMovementSchema,
} from "../validators/movement.validator";

function formatZodError(error: z.ZodError) {
  return {
    code: "VALIDATION_ERROR",
    message: "Datos de entrada inválidos",
    details: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
  };
}

export async function listByCase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = queryMovementSchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const result = await movementService.findByCase(req.firmId!, req.params.caseId as string, parsed.data);
    res.json({ data: result.data, meta: result.meta });
  } catch (err) { next(err); }
}

export async function createForCase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createMovementSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const movement = await movementService.create(
      req.firmId!,
      { ...parsed.data, caseId: req.params.caseId as string },
      req.user!.userId,
    );
    res.status(201).json({ data: movement });
  } catch (err) { next(err); }
}

export async function listByMatter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = queryMovementSchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const result = await movementService.findByMatter(req.firmId!, req.params.matterId as string, parsed.data);
    res.json({ data: result.data, meta: result.meta });
  } catch (err) { next(err); }
}

export async function createForMatter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createMovementSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const movement = await movementService.create(
      req.firmId!,
      { ...parsed.data, matterId: req.params.matterId as string },
      req.user!.userId,
    );
    res.status(201).json({ data: movement });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateMovementSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const movement = await movementService.update(req.firmId!, req.params.id as string, parsed.data, req.user!.userId);
    res.json({ data: movement });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await movementService.remove(req.firmId!, req.params.id as string, req.user!.userId);
    res.json({ data: { message: "Movimiento eliminado" } });
  } catch (err) { next(err); }
}
