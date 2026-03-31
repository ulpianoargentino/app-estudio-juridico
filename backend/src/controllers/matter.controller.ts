import { Request, Response, NextFunction } from "express";
import * as matterService from "../services/matter.service";
import { createMatterSchema, updateMatterSchema, queryMatterSchema, convertToCaseSchema } from "../validators/matter.validator";
import { formatZodError } from "../utils/format-validation-error";

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = queryMatterSchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const result = await matterService.findAll(req.firmId!, parsed.data);
    res.json({ data: result.data, meta: result.meta });
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const matter = await matterService.findById(req.firmId!, req.params.id as string);
    res.json({ data: matter });
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createMatterSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const matter = await matterService.create(req.firmId!, parsed.data, req.user!.userId);
    res.status(201).json({ data: matter });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateMatterSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const matter = await matterService.update(req.firmId!, req.params.id as string, parsed.data, req.user!.userId);
    res.json({ data: matter });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await matterService.softDelete(req.firmId!, req.params.id as string, req.user!.userId);
    res.json({ data: { message: "Caso eliminado" } });
  } catch (err) { next(err); }
}

export async function convert(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = convertToCaseSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const newCase = await matterService.convertToCase(req.firmId!, req.params.id as string, parsed.data, req.user!.userId);
    res.status(201).json({ data: newCase });
  } catch (err) { next(err); }
}
