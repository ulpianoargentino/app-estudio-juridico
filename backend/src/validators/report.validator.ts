import { z } from "zod/v4";
import { caseStatus, jurisdictionType, errandType, errandStatus } from "../models/enums";

const caseStatusValues = Object.values(caseStatus) as [string, ...string[]];
const jurisdictionTypeValues = Object.values(jurisdictionType) as [string, ...string[]];
const errandTypeValues = Object.values(errandType) as [string, ...string[]];
const errandStatusValues = Object.values(errandStatus) as [string, ...string[]];

// Accepts comma-separated values for multi-select filters
function csvArray(validValues: [string, ...string[]]) {
  return z.string().transform((v) => v.split(",").filter(Boolean)).pipe(
    z.array(z.enum(validValues))
  ).optional();
}

export const casesReportSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  export: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  status: csvArray(caseStatusValues),
  jurisdictionType: csvArray(jurisdictionTypeValues),
  responsibleAttorneyId: z.string().optional(),
  primaryClientId: z.string().optional(),
  courtId: z.string().optional(),
  startDateFrom: z.coerce.date().optional(),
  startDateTo: z.coerce.date().optional(),
  claimedAmountMin: z.coerce.number().min(0).optional(),
  claimedAmountMax: z.coerce.number().min(0).optional(),
  isActive: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  sort: z.enum(["updated_at", "created_at", "case_title", "case_number", "start_date", "claimed_amount"]).default("updated_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const casesExportSchema = z.object({
  format: z.enum(["csv"]).default("csv"),
  status: csvArray(caseStatusValues),
  jurisdictionType: csvArray(jurisdictionTypeValues),
  responsibleAttorneyId: z.string().optional(),
  primaryClientId: z.string().optional(),
  courtId: z.string().optional(),
  startDateFrom: z.coerce.date().optional(),
  startDateTo: z.coerce.date().optional(),
  claimedAmountMin: z.coerce.number().min(0).optional(),
  claimedAmountMax: z.coerce.number().min(0).optional(),
  isActive: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  sort: z.enum(["updated_at", "created_at", "case_title", "case_number", "start_date", "claimed_amount"]).default("updated_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const deadlinesReportSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(7),
  assignedToId: z.string().optional(),
});

export const errandsReportSchema = z.object({
  errandType: z.enum(errandTypeValues).optional(),
  responsibleId: z.string().optional(),
  status: z.enum(errandStatusValues).optional(),
});
