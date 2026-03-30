import { Request, Response, NextFunction } from "express";
import { z } from "zod/v4";
import * as eventService from "../services/event.service";
import {
  createEventSchema,
  updateEventSchema,
  queryEventSchema,
  upcomingEventSchema,
} from "../validators/event.validator";

function formatZodError(error: z.ZodError) {
  return {
    code: "VALIDATION_ERROR",
    message: "Datos de entrada inválidos",
    details: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
  };
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = queryEventSchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const result = await eventService.findAll(req.firmId!, parsed.data);
    res.json({ data: result.data, meta: result.meta });
  } catch (err) { next(err); }
}

export async function upcoming(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = upcomingEventSchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const data = await eventService.findUpcoming(req.firmId!, req.user!.userId, parsed.data.days);
    res.json({ data });
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const event = await eventService.create(req.firmId!, parsed.data, req.user!.userId);
    res.status(201).json({ data: event });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateEventSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const event = await eventService.update(req.firmId!, req.params.id as string, parsed.data, req.user!.userId);
    res.json({ data: event });
  } catch (err) { next(err); }
}

export async function complete(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const event = await eventService.complete(req.firmId!, req.params.id as string, req.user!.userId);
    res.json({ data: event });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await eventService.remove(req.firmId!, req.params.id as string, req.user!.userId);
    res.json({ data: { message: "Evento eliminado" } });
  } catch (err) { next(err); }
}

export async function listByCase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = queryEventSchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const result = await eventService.findByCase(req.firmId!, req.params.caseId as string, parsed.data);
    res.json({ data: result.data, meta: result.meta });
  } catch (err) { next(err); }
}

export async function listByMatter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = queryEventSchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const result = await eventService.findByMatter(req.firmId!, req.params.matterId as string, parsed.data);
    res.json({ data: result.data, meta: result.meta });
  } catch (err) { next(err); }
}
