import { Request, Response, NextFunction } from "express";
import * as courtService from "../services/court.service";
import { courtCreateSchema, courtUpdateSchema, courtQuerySchema } from "@shared";
import { formatZodError } from "../utils/zod-error";

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = courtQuerySchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const result = await courtService.findAll(req.firmId!, parsed.data);
    res.json({ data: result.data, meta: result.meta });
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const court = await courtService.findById(req.firmId!, req.params.id as string);
    res.json({ data: court });
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = courtCreateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const court = await courtService.create(req.firmId!, parsed.data, req.user!.userId);
    res.status(201).json({ data: court });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = courtUpdateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const court = await courtService.update(req.firmId!, req.params.id as string, parsed.data, req.user!.userId);
    res.json({ data: court });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await courtService.softDelete(req.firmId!, req.params.id as string, req.user!.userId);
    res.json({ data: { message: "Juzgado eliminado" } });
  } catch (err) { next(err); }
}
