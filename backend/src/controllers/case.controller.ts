import { Request, Response, NextFunction } from "express";
import * as caseService from "../services/case.service";
import { caseCreateSchema, caseUpdateSchema, caseQuerySchema, subCaseCreateSchema } from "@shared";
import { formatZodError } from "../utils/zod-error";

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = caseQuerySchema.safeParse(req.query);
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
    const parsed = caseCreateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const caseData = await caseService.create(req.firmId!, parsed.data, req.user!.userId);
    res.status(201).json({ data: caseData });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = caseUpdateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const caseData = await caseService.update(req.firmId!, req.params.id as string, parsed.data, req.user!.userId);
    res.json({ data: caseData });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await caseService.archive(req.firmId!, req.params.id as string, req.user!.userId);
    res.json({ data: { message: "Expediente archivado" } });
  } catch (err) { next(err); }
}

export async function archive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await caseService.archive(req.firmId!, req.params.id as string, req.user!.userId);
    res.json({ data: { message: "Expediente archivado" } });
  } catch (err) { next(err); }
}

export async function unarchive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await caseService.unarchive(req.firmId!, req.params.id as string, req.user!.userId);
    res.json({ data: { message: "Expediente desarchivado" } });
  } catch (err) { next(err); }
}

export async function summary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await caseService.getCaseSummary(req.firmId!);
    res.json({ data });
  } catch (err) { next(err); }
}

// POST /api/cases/:id/sub-cases
export async function createSubCase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = subCaseCreateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const sub = await caseService.createSubCase(req.firmId!, req.params.id as string, parsed.data, req.user!.userId);
    res.status(201).json({ data: sub });
  } catch (err) { next(err); }
}

// GET /api/cases/:id/sub-cases
export async function listSubCases(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await caseService.listSubCases(req.firmId!, req.params.id as string);
    res.json({ data });
  } catch (err) { next(err); }
}
