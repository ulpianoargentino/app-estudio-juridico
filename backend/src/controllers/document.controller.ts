import { Request, Response, NextFunction } from "express";
import { z } from "zod/v4";
import * as documentService from "../services/document.service";
import { createDocumentSchema, queryDocumentSchema } from "../validators/document.validator";

function formatZodError(error: z.ZodError) {
  return {
    code: "VALIDATION_ERROR",
    message: "Datos de entrada inválidos",
    details: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
  };
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = queryDocumentSchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const result = await documentService.findAll(req.firmId!, parsed.data);
    res.json({ data: result.data, meta: result.meta });
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const doc = await documentService.findById(req.firmId!, req.params.id as string);
    res.json({ data: doc });
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createDocumentSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const doc = await documentService.create(req.firmId!, parsed.data, req.user!.userId);
    res.status(201).json({ data: doc });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await documentService.remove(req.firmId!, req.params.id as string);
    res.json({ data: { message: "Documento eliminado" } });
  } catch (err) { next(err); }
}
