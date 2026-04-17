import { z } from "zod/v4";
import { idSchema, auditFieldsSchema, paginationQuerySchema, booleanQueryParam } from "./common";
import { personType, enumValues } from "./enums";

// Email opcional que también acepta "" (string vacío). react-hook-form valida
// contra el schema antes del submit usando el valor raw del input, que es ""
// cuando el usuario no llenó el campo — .email().nullish() rechazaría ese ""
// con "Email inválido" antes de que el service lo convierta a null.
const optionalEmail = z
  .string()
  .refine((v) => v === "" || z.email().safeParse(v).success, "Email inválido")
  .nullish();

// Campos editables por el usuario. Usamos un objeto base para derivar create,
// update y response sin duplicar la forma.
// cuitCuil: string libre. Aceptamos DNI (7-8 dígitos), CUIT (11 con o sin guiones),
// CUIL, etc. La validación de formato depende del tipo de documento y varía según
// la jurisdicción — se mantiene como texto sin parsear.
const personBaseSchema = z.object({
  personType: z.enum(enumValues(personType), { error: "Tipo de persona inválido" }),
  firstName: z.string().default(""),
  lastName: z.string().default(""),
  businessName: z.string().nullish(),
  cuitCuil: z.string().nullish(),
  email: optionalEmail,
  phone: z.string().nullish(),
  mobilePhone: z.string().nullish(),
  addressStreet: z.string().nullish(),
  addressCity: z.string().nullish(),
  addressState: z.string().nullish(),
  addressZip: z.string().nullish(),
  legalAddress: z.string().nullish(),
  appointedAddress: z.string().nullish(),
  notes: z.string().nullish(),
});

// POST /api/persons — física requiere nombre+apellido, jurídica requiere razón social.
export const personCreateSchema = personBaseSchema
  .refine(
    (data) => {
      if (data.personType === personType.INDIVIDUAL) {
        return data.firstName.trim().length > 0;
      }
      return true;
    },
    { message: "El nombre es obligatorio para personas físicas", path: ["firstName"] }
  )
  .refine(
    (data) => {
      if (data.personType === personType.INDIVIDUAL) {
        return data.lastName.trim().length > 0;
      }
      return true;
    },
    { message: "El apellido es obligatorio para personas físicas", path: ["lastName"] }
  )
  .refine(
    (data) => {
      if (data.personType === personType.LEGAL_ENTITY) {
        return !!data.businessName && data.businessName.trim().length > 0;
      }
      return true;
    },
    { message: "La razón social es obligatoria para personas jurídicas", path: ["businessName"] }
  );
export type PersonCreateInput = z.infer<typeof personCreateSchema>;

// PUT /api/persons/:id — todos los campos opcionales; los refines del create
// no aplican porque ya existe un registro válido en DB.
export const personUpdateSchema = z.object({
  personType: z.enum(enumValues(personType), { error: "Tipo de persona inválido" }).optional(),
  firstName: z.string().min(1, "El nombre es obligatorio").optional(),
  lastName: z.string().min(1, "El apellido es obligatorio").optional(),
  businessName: z.string().nullish(),
  cuitCuil: z.string().nullish(),
  email: optionalEmail,
  phone: z.string().nullish(),
  mobilePhone: z.string().nullish(),
  addressStreet: z.string().nullish(),
  addressCity: z.string().nullish(),
  addressState: z.string().nullish(),
  addressZip: z.string().nullish(),
  legalAddress: z.string().nullish(),
  appointedAddress: z.string().nullish(),
  notes: z.string().nullish(),
});
export type PersonUpdateInput = z.infer<typeof personUpdateSchema>;

// GET /api/persons — query params.
export const personQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  personType: z.enum(enumValues(personType)).optional(),
  isActive: booleanQueryParam.optional(),
  sort: z.enum(["last_name", "first_name", "created_at"]).default("last_name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});
export type PersonQuery = z.infer<typeof personQuerySchema>;

// Response del GET/POST/PUT (una persona completa).
export const personResponseSchema = z.object({
  id: idSchema,
  firmId: idSchema,
  personType: z.enum(enumValues(personType)),
  firstName: z.string(),
  lastName: z.string(),
  businessName: z.string().nullable(),
  cuitCuil: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  mobilePhone: z.string().nullable(),
  addressStreet: z.string().nullable(),
  addressCity: z.string().nullable(),
  addressState: z.string().nullable(),
  addressZip: z.string().nullable(),
  legalAddress: z.string().nullable(),
  appointedAddress: z.string().nullable(),
  notes: z.string().nullable(),
  isActive: z.boolean(),
  ...auditFieldsSchema.shape,
});
export type Person = z.infer<typeof personResponseSchema>;

// GET /api/persons/:id — incluye vinculaciones a cases/matters con rol.
// Ver person.service.ts::findById.
export const personPartyLinkSchema = z.object({
  id: idSchema,
  role: z.string(),
  caseId: idSchema.nullable(),
  matterId: idSchema.nullable(),
  caseTitle: z.string().nullable(),
  caseNumber: z.string().nullable(),
  matterTitle: z.string().nullable(),
});
export const personDetailSchema = personResponseSchema.extend({
  parties: z.array(personPartyLinkSchema),
});
export type PersonDetail = z.infer<typeof personDetailSchema>;

// GET /api/persons/search?q=... — devuelve lista reducida.
export const personSearchResultSchema = z.object({
  id: idSchema,
  firstName: z.string(),
  lastName: z.string(),
  businessName: z.string().nullable(),
  cuitCuil: z.string().nullable(),
  personType: z.enum(enumValues(personType)),
});
export type PersonSearchResult = z.infer<typeof personSearchResultSchema>;
