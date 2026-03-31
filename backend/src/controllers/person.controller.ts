import { Request, Response, NextFunction } from "express";
import * as personService from "../services/person.service";
import {
  createPersonSchema,
  updatePersonSchema,
  queryPersonSchema,
} from "../validators/person.validator";
import { formatZodError } from "../utils/format-validation-error";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = queryPersonSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const result = await personService.findAll(req.firmId!, parsed.data);
    res.json({ data: result.data, meta: result.meta });
  } catch (err) {
    next(err);
  }
}

export async function getById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const person = await personService.findById(req.firmId!, req.params.id as string);
    res.json({ data: person });
  } catch (err) {
    next(err);
  }
}

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createPersonSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const person = await personService.create(
      req.firmId!,
      parsed.data,
      req.user!.userId
    );
    res.status(201).json({ data: person });
  } catch (err) {
    next(err);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = updatePersonSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const person = await personService.update(
      req.firmId!,
      req.params.id as string,
      parsed.data,
      req.user!.userId
    );
    res.json({ data: person });
  } catch (err) {
    next(err);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await personService.softDelete(
      req.firmId!,
      req.params.id as string,
      req.user!.userId
    );
    res.json({ data: { message: "Persona eliminada" } });
  } catch (err) {
    next(err);
  }
}

export async function search(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const results = await personService.search(req.firmId!, q);
    res.json({ data: results });
  } catch (err) {
    next(err);
  }
}
