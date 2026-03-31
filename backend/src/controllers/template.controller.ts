import { Request, Response, NextFunction } from "express";
import { z } from "zod/v4";
import * as templateService from "../services/template.service";
import { createTemplateSchema, updateTemplateSchema, queryTemplateSchema, renderTemplateSchema } from "../validators/template.validator";

function formatZodError(error: z.ZodError) {
  return {
    code: "VALIDATION_ERROR",
    message: "Datos de entrada invalidos",
    details: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
  };
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = queryTemplateSchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const result = await templateService.findAll(req.firmId!, parsed.data);
    res.json({ data: result.data, meta: result.meta });
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const template = await templateService.findById(req.firmId!, req.params.id as string);
    res.json({ data: template });
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createTemplateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const template = await templateService.create(req.firmId!, parsed.data, req.user!.userId);
    res.status(201).json({ data: template });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateTemplateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const template = await templateService.update(req.firmId!, req.params.id as string, parsed.data, req.user!.userId);
    res.json({ data: template });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await templateService.softDelete(req.firmId!, req.params.id as string, req.user!.userId);
    res.json({ data: { message: "Plantilla eliminada" } });
  } catch (err) { next(err); }
}

export async function render(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = renderTemplateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const result = await templateService.renderTemplate(req.firmId!, req.params.id as string, parsed.data.caseId, req.user!.userId);
    res.json({ data: result });
  } catch (err) { next(err); }
}

export async function variables(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vars = templateService.getAvailableVariables();
    res.json({ data: vars });
  } catch (err) { next(err); }
}
