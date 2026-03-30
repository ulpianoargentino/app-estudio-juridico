import { z } from "zod/v4";
import { caseStatus, jurisdictionType } from "../models/enums";

const caseStatusValues = Object.values(caseStatus) as [string, ...string[]];
const jurisdictionTypeValues = Object.values(jurisdictionType) as [string, ...string[]];

export const createCaseSchema = z.object({
  caseNumber: z.string().nullish(),
  caseTitle: z.string().min(1, "La carátula es obligatoria"),
  jurisdictionType: z.enum(jurisdictionTypeValues, { error: "Fuero inválido" }),
  jurisdiction: z.string().nullish(),
  courtId: z.string().nullish(),
  processType: z.string().nullish(),
  status: z.enum(caseStatusValues, { error: "Estado inválido" }).default("INITIAL"),
  primaryClientId: z.string().nullish(),
  responsibleAttorneyId: z.string().nullish(),
  startDate: z.coerce.date().nullish(),
  claimedAmount: z
    .string()
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "El monto debe ser mayor o igual a 0")
    .nullish(),
  currency: z.enum(["ARS", "USD"], { error: "Moneda inválida (ARS o USD)" }).nullish(),
  portalUrl: z.string().url("URL inválida").nullish(),
  notes: z.string().nullish(),
});

export const updateCaseSchema = z.object({
  caseNumber: z.string().nullish(),
  caseTitle: z.string().min(1, "La carátula es obligatoria").optional(),
  jurisdictionType: z.enum(jurisdictionTypeValues, { error: "Fuero inválido" }).optional(),
  jurisdiction: z.string().nullish(),
  courtId: z.string().nullish(),
  processType: z.string().nullish(),
  status: z.enum(caseStatusValues, { error: "Estado inválido" }).optional(),
  primaryClientId: z.string().nullish(),
  responsibleAttorneyId: z.string().nullish(),
  startDate: z.coerce.date().nullish(),
  claimedAmount: z
    .string()
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "El monto debe ser mayor o igual a 0")
    .nullish(),
  currency: z.enum(["ARS", "USD"], { error: "Moneda inválida (ARS o USD)" }).nullish(),
  portalUrl: z.string().url("URL inválida").nullish(),
  notes: z.string().nullish(),
});

export const queryCaseSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(caseStatusValues).optional(),
  jurisdictionType: z.enum(jurisdictionTypeValues).optional(),
  responsibleAttorneyId: z.string().optional(),
  primaryClientId: z.string().optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  sort: z.enum(["updated_at", "created_at", "case_title", "case_number"]).default("updated_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
