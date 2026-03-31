import { Request, Response, NextFunction } from "express";
import { z } from "zod/v4";
import { Parser } from "json2csv";
import * as reportService from "../services/report.service";
import {
  casesReportSchema,
  casesExportSchema,
  deadlinesReportSchema,
  errandsReportSchema,
} from "../validators/report.validator";

function formatZodError(error: z.ZodError) {
  return {
    code: "VALIDATION_ERROR",
    message: "Datos de entrada inválidos",
    details: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
  };
}

// Status and jurisdiction labels in Spanish for CSV export
const statusLabels: Record<string, string> = {
  INITIAL: "Inicio",
  IN_PROGRESS: "En trámite",
  EVIDENCE_STAGE: "En prueba",
  CLOSING_ARGUMENTS: "Alegatos",
  AWAITING_JUDGMENT: "Para sentencia",
  JUDGMENT_ISSUED: "Sentencia",
  IN_EXECUTION: "En ejecución",
  ARCHIVED: "Archivado",
  SUSPENDED: "Paralizado",
  IN_MEDIATION: "Mediación",
};

const jurisdictionLabels: Record<string, string> = {
  CIVIL_COMMERCIAL: "Civil y Comercial",
  LABOR: "Laboral",
  CRIMINAL: "Penal",
  FAMILY: "Familia",
  ADMINISTRATIVE: "Contencioso Administrativo",
  COLLECTIONS: "Cobros y Apremios",
  PROBATE: "Sucesiones",
  EXTRAJUDICIAL: "Extrajudicial",
};

function formatDate(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
}

export async function casesReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = casesReportSchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }

    const result = await reportService.findCasesForReport(req.firmId!, {
      ...parsed.data,
      export: parsed.data.export ?? false,
    });

    res.json({ data: result.data, meta: result.meta });
  } catch (err) { next(err); }
}

export async function casesExport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = casesExportSchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }

    const result = await reportService.findCasesForReport(req.firmId!, {
      ...parsed.data,
      export: true,
      sort: parsed.data.sort,
      order: parsed.data.order,
    });

    const csvFields = [
      { label: "N° Expediente", value: "caseNumber" },
      { label: "Carátula", value: "caseTitle" },
      { label: "Fuero", value: (row: any) => jurisdictionLabels[row.jurisdictionType] ?? row.jurisdictionType },
      { label: "Estado", value: (row: any) => statusLabels[row.status] ?? row.status },
      { label: "Juzgado", value: "courtName" },
      { label: "Abogado responsable", value: "responsibleAttorneyName" },
      { label: "Cliente", value: "primaryClientName" },
      { label: "Fecha de inicio", value: (row: any) => formatDate(row.startDate) },
      { label: "Monto reclamado", value: "claimedAmount" },
      { label: "Moneda", value: "currency" },
      { label: "Última actualización", value: (row: any) => formatDate(row.updatedAt) },
    ];

    const parser = new Parser({ fields: csvFields, withBOM: true });
    const csv = parser.parse(result.data);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=expedientes.csv");
    res.send(csv);
  } catch (err) { next(err); }
}

export async function deadlinesReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = deadlinesReportSchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }

    const data = await reportService.findDeadlines(req.firmId!, parsed.data);
    res.json({ data });
  } catch (err) { next(err); }
}

export async function errandsReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = errandsReportSchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }

    const data = await reportService.findErrands(req.firmId!, parsed.data);
    res.json({ data });
  } catch (err) { next(err); }
}
