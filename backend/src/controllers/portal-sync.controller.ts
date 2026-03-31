import { Request, Response, NextFunction } from "express";
import { z } from "zod/v4";
import * as portalSyncService from "../services/portal-sync.service";
import { syncLogsQuerySchema } from "../validators/portal-credential.validator";

function formatZodError(error: z.ZodError) {
  return {
    code: "VALIDATION_ERROR",
    message: "Datos de entrada inválidos",
    details: error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    })),
  };
}

// POST /api/portal-sync — sync all active credentials for the firm
export async function syncAll(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const results = await portalSyncService.triggerFullSync(req.firmId!);
    res.json({ data: results });
  } catch (err) {
    next(err);
  }
}

// POST /api/portal-sync/:credentialId — sync a single credential
export async function syncOne(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await portalSyncService.triggerCredentialSync(
      req.firmId!,
      req.params.credentialId as string
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

// GET /api/portal-sync/logs — get sync history
export async function getLogs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = syncLogsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }
    const logs = await portalSyncService.getSyncLogs(
      req.firmId!,
      parsed.data.credentialId,
      parsed.data.limit
    );
    res.json({ data: logs });
  } catch (err) {
    next(err);
  }
}
