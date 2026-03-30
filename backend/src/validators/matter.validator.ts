import { z } from "zod/v4";
import { matterType, matterStatus, caseStatus, jurisdictionType } from "../models/enums";

const matterTypeValues = Object.values(matterType) as [string, ...string[]];
const matterStatusValues = Object.values(matterStatus) as [string, ...string[]];
const caseStatusValues = Object.values(caseStatus) as [string, ...string[]];
const jurisdictionTypeValues = Object.values(jurisdictionType) as [string, ...string[]];

export const createMatterSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  matterType: z.enum(matterTypeValues, { error: "Tipo de caso inválido" }),
  status: z.enum(matterStatusValues, { error: "Estado inválido" }).default("ACTIVE"),
  primaryClientId: z.string().nullish(),
  opposingPartyId: z.string().nullish(),
  responsibleAttorneyId: z.string().nullish(),
  startDate: z.coerce.date().nullish(),
  estimatedFee: z
    .string()
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "El honorario debe ser mayor o igual a 0")
    .nullish(),
  currency: z.enum(["ARS", "USD"], { error: "Moneda inválida" }).nullish(),
  notes: z.string().nullish(),
});

export const updateMatterSchema = z.object({
  title: z.string().min(1, "El título es obligatorio").optional(),
  matterType: z.enum(matterTypeValues, { error: "Tipo de caso inválido" }).optional(),
  status: z.enum(matterStatusValues, { error: "Estado inválido" }).optional(),
  primaryClientId: z.string().nullish(),
  opposingPartyId: z.string().nullish(),
  responsibleAttorneyId: z.string().nullish(),
  startDate: z.coerce.date().nullish(),
  estimatedFee: z
    .string()
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "El honorario debe ser mayor o igual a 0")
    .nullish(),
  currency: z.enum(["ARS", "USD"], { error: "Moneda inválida" }).nullish(),
  notes: z.string().nullish(),
});

export const queryMatterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(matterStatusValues).optional(),
  matterType: z.enum(matterTypeValues).optional(),
  responsibleAttorneyId: z.string().optional(),
  primaryClientId: z.string().optional(),
  isActive: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  sort: z.enum(["updated_at", "created_at", "title"]).default("updated_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// Schema para convertir matter a case
export const convertToCaseSchema = z.object({
  caseTitle: z.string().min(1, "La carátula es obligatoria"),
  caseNumber: z.string().nullish(),
  jurisdictionType: z.enum(jurisdictionTypeValues, { error: "Fuero inválido" }),
  jurisdiction: z.string().nullish(),
  courtId: z.string().nullish(),
  processType: z.string().nullish(),
  status: z.enum(caseStatusValues, { error: "Estado inválido" }).default("INITIAL"),
});
