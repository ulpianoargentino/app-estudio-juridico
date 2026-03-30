import { Request, Response, NextFunction } from "express";
import { z } from "zod/v4";
import * as documentService from "../services/document.service";
import { uploadDocumentSchema } from "../validators/document.validator";
import { AppError } from "../middleware/error-handler";

function formatZodError(error: z.ZodError) {
  return {
    code: "VALIDATION_ERROR",
    message: "Datos de entrada inválidos",
    details: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
  };
}

export async function uploadForCase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError(400, "FILE_REQUIRED", "Se requiere un archivo");
    }

    const parsed = uploadDocumentSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }

    const doc = await documentService.upload(
      req.firmId!,
      req.file,
      { caseId: req.params.caseId as string, ...parsed.data },
      req.user!.userId
    );
    res.status(201).json({ data: doc });
  } catch (err) { next(err); }
}

export async function uploadForMatter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError(400, "FILE_REQUIRED", "Se requiere un archivo");
    }

    const parsed = uploadDocumentSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }

    const doc = await documentService.upload(
      req.firmId!,
      req.file,
      { matterId: req.params.matterId as string, ...parsed.data },
      req.user!.userId
    );
    res.status(201).json({ data: doc });
  } catch (err) { next(err); }
}

export async function listByCase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const docs = await documentService.findByCase(req.firmId!, req.params.caseId as string);
    res.json({ data: docs });
  } catch (err) { next(err); }
}

export async function listByMatter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const docs = await documentService.findByMatter(req.firmId!, req.params.matterId as string);
    res.json({ data: docs });
  } catch (err) { next(err); }
}

export async function download(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { stream, fileName, mimeType } = await documentService.getDownloadInfo(req.firmId!, req.params.id as string);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
    stream.pipe(res);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await documentService.remove(req.firmId!, req.params.id as string);
    res.json({ data: { message: "Documento eliminado" } });
  } catch (err) { next(err); }
}
