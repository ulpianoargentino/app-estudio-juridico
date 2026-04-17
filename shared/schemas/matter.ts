import { z } from "zod/v4";
import {
  idSchema,
  timestampSchema,
  auditFieldsSchema,
  paginationQuerySchema,
  booleanQueryParam,
} from "./common";
import {
  matterType,
  matterStatus,
  caseStatus,
  jurisdictionType,
  personType,
  partyRole,
  enumValues,
} from "./enums";

const CURRENCY = z.enum(["ARS", "USD"], { error: "Moneda inválida" });

const estimatedFeeInput = z
  .string()
  .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "El honorario debe ser mayor o igual a 0")
  .nullish();

// POST /api/matters
export const matterCreateSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  matterType: z.enum(enumValues(matterType), { error: "Tipo de caso inválido" }),
  status: z
    .enum(enumValues(matterStatus), { error: "Estado inválido" })
    .default(matterStatus.ACTIVE),
  primaryClientId: idSchema.nullish(),
  opposingPartyId: idSchema.nullish(),
  responsibleAttorneyId: idSchema.nullish(),
  startDate: z.coerce.date().nullish(),
  estimatedFee: estimatedFeeInput,
  currency: CURRENCY.nullish(),
  notes: z.string().nullish(),
});
export type MatterCreateInput = z.infer<typeof matterCreateSchema>;

// PUT /api/matters/:id
export const matterUpdateSchema = z.object({
  title: z.string().min(1, "El título es obligatorio").optional(),
  matterType: z.enum(enumValues(matterType), { error: "Tipo de caso inválido" }).optional(),
  status: z.enum(enumValues(matterStatus), { error: "Estado inválido" }).optional(),
  primaryClientId: idSchema.nullish(),
  opposingPartyId: idSchema.nullish(),
  responsibleAttorneyId: idSchema.nullish(),
  startDate: z.coerce.date().nullish(),
  estimatedFee: estimatedFeeInput,
  currency: CURRENCY.nullish(),
  notes: z.string().nullish(),
});
export type MatterUpdateInput = z.infer<typeof matterUpdateSchema>;

// GET /api/matters — query
export const matterQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  status: z.enum(enumValues(matterStatus)).optional(),
  matterType: z.enum(enumValues(matterType)).optional(),
  responsibleAttorneyId: idSchema.optional(),
  primaryClientId: idSchema.optional(),
  isActive: booleanQueryParam.optional(),
  sort: z.enum(["updated_at", "created_at", "title"]).default("updated_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type MatterQuery = z.infer<typeof matterQuerySchema>;

// POST /api/matters/:id/convert
export const matterConvertToCaseSchema = z.object({
  caseTitle: z.string().min(1, "La carátula es obligatoria"),
  caseNumber: z.string().nullish(),
  jurisdictionType: z.enum(enumValues(jurisdictionType), { error: "Fuero inválido" }),
  jurisdiction: z.string().nullish(),
  courtId: idSchema.nullish(),
  processType: z.string().nullish(),
  status: z
    .enum(enumValues(caseStatus), { error: "Estado inválido" })
    .default(caseStatus.INITIAL),
});
export type MatterConvertToCaseInput = z.infer<typeof matterConvertToCaseSchema>;

// Base compartida — record completo del matter.
const matterRecordSchema = z.object({
  id: idSchema,
  firmId: idSchema,
  title: z.string(),
  matterType: z.enum(enumValues(matterType)),
  status: z.enum(enumValues(matterStatus)),
  primaryClientId: idSchema.nullable(),
  opposingPartyId: idSchema.nullable(),
  responsibleAttorneyId: idSchema.nullable(),
  startDate: timestampSchema.nullable(),
  estimatedFee: z.string().nullable(),
  currency: z.string().nullable(),
  notes: z.string().nullable(),
  convertedToCaseId: idSchema.nullable(),
  isActive: z.boolean(),
  ...auditFieldsSchema.shape,
});

export const matterResponseSchema = matterRecordSchema;
export type Matter = z.infer<typeof matterResponseSchema>;

// Row de lista (GET /api/matters): record + nombres cliente/abogado.
export const matterListItemSchema = matterRecordSchema.extend({
  primaryClientName: z.string().nullable(),
  responsibleAttorneyName: z.string().nullable(),
});
export type MatterListItem = z.infer<typeof matterListItemSchema>;

// GET /api/matters/:id — record + relaciones + contadores.
const clientSummarySchema = z.object({
  id: idSchema,
  firstName: z.string(),
  lastName: z.string(),
  businessName: z.string().nullable(),
  personType: z.enum(enumValues(personType)),
});
const attorneySummarySchema = z.object({
  id: idSchema,
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
});
const matterPartyLinkSchema = z.object({
  id: idSchema,
  role: z.enum(enumValues(partyRole)),
  notes: z.string().nullable(),
  personId: idSchema,
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  businessName: z.string().nullable(),
  personType: z.enum(enumValues(personType)).nullable(),
});

export const matterDetailSchema = matterRecordSchema.extend({
  primaryClient: clientSummarySchema.nullable(),
  responsibleAttorney: attorneySummarySchema.nullable(),
  parties: z.array(matterPartyLinkSchema),
  movementCount: z.number().int().nonnegative(),
  documentCount: z.number().int().nonnegative(),
});
export type MatterDetail = z.infer<typeof matterDetailSchema>;
