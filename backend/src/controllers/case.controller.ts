import { Request, Response, NextFunction } from "express";
import { z } from "zod/v4";
import * as caseService from "../services/case.service";
import { createCaseSchema, updateCaseSchema, queryCaseSchema } from "../validators/case.validator";

function formatZodError(error: z.ZodError) {
  return {
    code: "VALIDATION_ERROR",
    message: "Datos de entrada inválidos",
    details: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
  };
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = queryCaseSchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const result = await caseService.findAll(req.firmId!, parsed.data);
    res.json({ data: result.data, meta: result.meta });
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const caseData = await caseService.findById(req.firmId!, req.params.id as string);
    res.json({ data: caseData });
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createCaseSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const caseData = await caseService.create(req.firmId!, parsed.data, req.user!.userId);
    res.status(201).json({ data: caseData });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateCaseSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const caseData = await caseService.update(req.firmId!, req.params.id as string, parsed.data, req.user!.userId);
    res.json({ data: caseData });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await caseService.softDelete(req.firmId!, req.params.id as string, req.user!.userId);
    res.json({ data: { message: "Expediente eliminado" } });
  } catch (err) { next(err); }
}

export async function summary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await caseService.getCaseSummary(req.firmId!);
    res.json({ data });
  } catch (err) { next(err); }
}
