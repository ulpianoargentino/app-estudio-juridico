import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { movements, documents } from "../models";
import { uuidv7 } from "../utils/uuid";
import * as pdfService from "../services/pdf.service";
import { AppError } from "../middleware/error-handler";

export async function generatePdf(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { html, options } = req.body;
    if (!html) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "html es obligatorio" } });
      return;
    }

    const pdfBuffer = await pdfService.generatePdf(html, options || {});

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="escrito.pdf"',
      "Content-Length": pdfBuffer.length.toString(),
    });
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

export async function save(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { caseId, title, html, generatePdf: shouldGeneratePdf } = req.body;

    if (!caseId || !title || !html) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "caseId, title y html son obligatorios" },
      });
      return;
    }

    const firmId = req.firmId!;
    const userId = req.user!.userId;
    const now = new Date();

    // Create the movement
    const movementId = uuidv7();
    await db.insert(movements).values({
      id: movementId,
      firmId,
      caseId,
      movementDate: now,
      movementType: "FILING",
      description: title,
      createdBy: userId,
      updatedBy: userId,
    });

    // Save the HTML document
    const htmlDocId = uuidv7();
    await db.insert(documents).values({
      id: htmlDocId,
      firmId,
      caseId,
      movementId,
      fileName: `${title}.html`,
      fileUrl: `data:text/html;base64,${Buffer.from(html).toString("base64")}`,
      fileSize: Buffer.byteLength(html, "utf8"),
      mimeType: "text/html",
      category: "FILING",
      createdBy: userId,
      updatedBy: userId,
    });

    const result: { movementId: string; documentId: string; pdfDocumentId?: string } = {
      movementId,
      documentId: htmlDocId,
    };

    // Optionally generate and save PDF
    if (shouldGeneratePdf) {
      try {
        const pdfBuffer = await pdfService.generatePdf(html);
        const pdfDocId = uuidv7();
        await db.insert(documents).values({
          id: pdfDocId,
          firmId,
          caseId,
          movementId,
          fileName: `${title}.pdf`,
          fileUrl: `data:application/pdf;base64,${pdfBuffer.toString("base64")}`,
          fileSize: pdfBuffer.length,
          mimeType: "application/pdf",
          category: "FILING",
          createdBy: userId,
          updatedBy: userId,
        });
        result.pdfDocumentId = pdfDocId;
      } catch {
        // PDF generation failed but HTML was saved; report partial success
        throw new AppError(207, "PDF_GENERATION_FAILED", "El escrito se guardó pero no se pudo generar el PDF");
      }
    }

    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}
