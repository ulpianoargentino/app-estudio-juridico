import { z } from "zod/v4";
import {
  idSchema,
  timestampSchema,
  auditFieldsSchema,
  paginationQuerySchema,
  booleanQueryParam,
} from "./common";
import {
  caseStatus,
  jurisdictionType,
  personType,
  partyRole,
  subCaseType,
  enumValues,
} from "./enums";

// Moneda opcional que también acepta "" (string vacío). react-hook-form valida
// contra el schema antes del submit usando el valor raw del input, que es ""
// cuando el usuario no seleccionó ARS/USD — z.enum().nullish() rechazaría ese "".
const optionalCurrency = z
  .string()
  .refine(
    (v) => v === "" || v === "ARS" || v === "USD",
    "Moneda inválida (ARS o USD)"
  )
  .nullish();

// URL opcional que también acepta "" (string vacío). Mismo motivo que arriba:
// z.url().nullish() rechazaría "" antes de que el form lo convierta a undefined.
const optionalPortalUrl = z
  .string()
  .refine((v) => v === "" || z.url().safeParse(v).success, "URL inválida")
  .nullish();

// CLAIMED_AMOUNT se guarda como numeric en Postgres y el driver lo devuelve como
// string. En el create lo validamos como string numérico.
const claimedAmountInput = z
  .string()
  .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "El monto debe ser mayor o igual a 0")
  .nullish();

// POST /api/cases
export const caseCreateSchema = z.object({
  caseNumber: z.string().nullish(),
  caseTitle: z.string().min(1, "La carátula es obligatoria"),
  jurisdictionType: z.enum(enumValues(jurisdictionType), { error: "Fuero inválido" }),
  jurisdiction: z.string().nullish(),
  courtId: idSchema.nullish(),
  processType: z.string().nullish(),
  status: z.enum(enumValues(caseStatus), { error: "Estado inválido" }).default(caseStatus.INITIAL),
  primaryClientId: idSchema.nullish(),
  responsibleAttorneyId: idSchema.nullish(),
  startDate: z.coerce.date().nullish(),
  claimedAmount: claimedAmountInput,
  currency: optionalCurrency,
  portalUrl: optionalPortalUrl,
  notes: z.string().nullish(),
});
export type CaseCreateInput = z.infer<typeof caseCreateSchema>;

// PUT /api/cases/:id
export const caseUpdateSchema = z.object({
  caseNumber: z.string().nullish(),
  caseTitle: z.string().min(1, "La carátula es obligatoria").optional(),
  jurisdictionType: z
    .enum(enumValues(jurisdictionType), { error: "Fuero inválido" })
    .optional(),
  jurisdiction: z.string().nullish(),
  courtId: idSchema.nullish(),
  processType: z.string().nullish(),
  status: z.enum(enumValues(caseStatus), { error: "Estado inválido" }).optional(),
  primaryClientId: idSchema.nullish(),
  responsibleAttorneyId: idSchema.nullish(),
  startDate: z.coerce.date().nullish(),
  claimedAmount: claimedAmountInput,
  currency: optionalCurrency,
  portalUrl: optionalPortalUrl,
  notes: z.string().nullish(),
});
export type CaseUpdateInput = z.infer<typeof caseUpdateSchema>;

// GET /api/cases — query params
export const caseQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  status: z.enum(enumValues(caseStatus)).optional(),
  jurisdictionType: z.enum(enumValues(jurisdictionType)).optional(),
  responsibleAttorneyId: idSchema.optional(),
  primaryClientId: idSchema.optional(),
  isActive: booleanQueryParam.optional(),
  sort: z
    .enum(["updated_at", "created_at", "case_title", "case_number"])
    .default("updated_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type CaseQuery = z.infer<typeof caseQuerySchema>;

// Base compartida entre respuestas (el record completo del case).
const caseRecordSchema = z.object({
  id: idSchema,
  firmId: idSchema,
  caseNumber: z.string().nullable(),
  caseTitle: z.string(),
  jurisdictionType: z.enum(enumValues(jurisdictionType)),
  jurisdiction: z.string().nullable(),
  courtId: idSchema.nullable(),
  processType: z.string().nullable(),
  status: z.enum(enumValues(caseStatus)),
  primaryClientId: idSchema.nullable(),
  responsibleAttorneyId: idSchema.nullable(),
  startDate: timestampSchema.nullable(),
  // numeric viaja como string desde postgres-js
  claimedAmount: z.string().nullable(),
  currency: z.string().nullable(),
  portalUrl: z.string().nullable(),
  notes: z.string().nullable(),
  // Sub-expediente: NULL en padres y expedientes normales. En subs:
  //   subCaseType    — opcional (EVIDENCE/INCIDENT/OTHER) o NULL
  //   subCaseNumber  — opcional, texto libre. La UI lo muestra concatenado
  //                    como "{padre.caseNumber}-{subCaseNumber}".
  subCaseType: z.enum(enumValues(subCaseType)).nullable(),
  subCaseNumber: z.string().nullable(),
  subCaseDescription: z.string().nullable(),
  isActive: z.boolean(),
  ...auditFieldsSchema.shape,
});

// Respuesta de POST/PUT/DELETE: record crudo sin joins.
export const caseResponseSchema = caseRecordSchema;
export type Case = z.infer<typeof caseResponseSchema>;

// Row de lista (GET /api/cases): record + nombres del cliente y abogado.
// Ver case.service.ts::findAll. El listado principal sólo trae padres
// (subCaseType IS NULL); subCaseCount cuenta hijos activos.
export const caseListItemSchema = caseRecordSchema.extend({
  primaryClientName: z.string().nullable(),
  responsibleAttorneyName: z.string().nullable(),
  subCaseCount: z.number().int().nonnegative().default(0),
});
export type CaseListItem = z.infer<typeof caseListItemSchema>;

// GET /api/cases/:id — record + relaciones expandidas + contadores.
// Ver case.service.ts::findById.
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
const casePartyLinkSchema = z.object({
  id: idSchema,
  role: z.enum(enumValues(partyRole)),
  notes: z.string().nullable(),
  personId: idSchema,
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  businessName: z.string().nullable(),
  personType: z.enum(enumValues(personType)).nullable(),
});

export const caseDetailSchema = caseRecordSchema.extend({
  court: z
    .object({
      id: idSchema,
      firmId: idSchema,
      name: z.string(),
      courtType: z.string(),
      jurisdiction: z.string(),
      address: z.string().nullable(),
      phone: z.string().nullable(),
      email: z.string().nullable(),
      notes: z.string().nullable(),
      isActive: z.boolean(),
      ...auditFieldsSchema.shape,
    })
    .nullable(),
  primaryClient: clientSummarySchema.nullable(),
  responsibleAttorney: attorneySummarySchema.nullable(),
  parties: z.array(casePartyLinkSchema),
  movementCount: z.number().int().nonnegative(),
  documentCount: z.number().int().nonnegative(),
  upcomingEventCount: z.number().int().nonnegative(),
  // Sólo presente si el case actual es un sub (subCaseType !== null).
  parent: z
    .object({
      id: idSchema,
      caseNumber: z.string().nullable(),
      caseTitle: z.string(),
    })
    .nullable(),
  subCaseCount: z.number().int().nonnegative().default(0),
});
export type CaseDetail = z.infer<typeof caseDetailSchema>;

// GET /api/cases/summary — { status: count }
export const caseSummarySchema = z.record(z.string(), z.number().int().nonnegative());
export type CaseSummary = z.infer<typeof caseSummarySchema>;

// POST /api/cases/:id/sub-cases
// Modelo flexible: TODOS los campos son opcionales.
//   subCaseType         — opcional. Si viene, EVIDENCE/INCIDENT/OTHER.
//   subCaseNumber       — opcional, texto libre. La UI sugiere "A1/I1/X1" según
//                         el tipo via endpoint /next-number, pero el usuario
//                         puede escribir cualquier cosa o dejar vacío.
//   caseTitle           — opcional. Si no viene, se hereda del padre.
//   subCaseDescription  — opcional, texto libre.
//   notes               — opcional.
// El resto (juzgado, cliente, abogado, fuero, jurisdicción) siempre se hereda
// del padre.
export const subCaseCreateSchema = z.object({
  subCaseType: z.enum(enumValues(subCaseType), { error: "Tipo inválido" }).nullish(),
  subCaseNumber: z.string().nullish(),
  caseTitle: z.string().nullish(),
  subCaseDescription: z.string().nullish(),
  notes: z.string().nullish(),
});
export type SubCaseCreateInput = z.infer<typeof subCaseCreateSchema>;

// Item en el listado GET /api/cases/:id/sub-cases.
// Vista chica: lo justo para mostrar tabla en la tab del padre.
// El frontend concatena el número con `parentCaseNumber` para renderizar
// "{padre}-{sub}" — por eso parentCaseNumber viaja en cada row.
export const subCaseListItemSchema = z.object({
  id: idSchema,
  caseTitle: z.string(),
  status: z.enum(enumValues(caseStatus)),
  subCaseType: z.enum(enumValues(subCaseType)).nullable(),
  subCaseNumber: z.string().nullable(),
  subCaseDescription: z.string().nullable(),
  parentCaseNumber: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: timestampSchema,
});
export type SubCaseListItem = z.infer<typeof subCaseListItemSchema>;

// GET /api/cases/:id/sub-cases/next-number?type=EVIDENCE
// Sugerencia de próximo número de sub para el padre+tipo dado.
export const subCaseNextNumberQuerySchema = z.object({
  type: z.enum(enumValues(subCaseType), { error: "Tipo inválido" }),
});
export type SubCaseNextNumberQuery = z.infer<typeof subCaseNextNumberQuerySchema>;

export const subCaseNextNumberResponseSchema = z.object({
  suggested: z.string(),
});
export type SubCaseNextNumberResponse = z.infer<typeof subCaseNextNumberResponseSchema>;

// Info del padre que se devuelve en el GET /api/cases/:id cuando :id es un sub.
// Sirve para el banner "Este es un subexpediente de {carátula}" en el detalle.
export const parentCaseSummarySchema = z.object({
  id: idSchema,
  caseNumber: z.string().nullable(),
  caseTitle: z.string(),
});
export type ParentCaseSummary = z.infer<typeof parentCaseSummarySchema>;
