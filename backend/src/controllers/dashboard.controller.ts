import { Request, Response, NextFunction } from "express";
import * as dashboardService from "../services/dashboard.service";

export async function getStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await dashboardService.getStats(req.firmId!);
    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
}
