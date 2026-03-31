import { Request, Response, NextFunction } from "express";
import * as templateService from "../services/template.service";

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { category, search } = req.query;
    const data = await templateService.findAll(req.firmId!, {
      category: category as string | undefined,
      search: search as string | undefined,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await templateService.findById(req.firmId!, req.params.id as string);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function render(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { caseId } = req.body;
    if (!caseId) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "caseId es obligatorio" } });
      return;
    }
    const data = await templateService.render(req.firmId!, req.params.id as string, caseId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}
