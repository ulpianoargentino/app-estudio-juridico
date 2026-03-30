import { z } from "zod/v4";
import { personType } from "../models/enums";

const CUIT_CUIL_REGEX = /^\d{2}-\d{8}-\d$/;

const personTypeValues = Object.values(personType) as [string, ...string[]];

export const createPersonSchema = z
  .object({
    personType: z.enum(personTypeValues, { error: "Tipo de persona inválido" }),
    firstName: z.string().default(""),
    lastName: z.string().default(""),
    businessName: z.string().nullish(),
    cuitCuil: z
      .string()
      .regex(CUIT_CUIL_REGEX, "Formato de CUIT/CUIL inválido (XX-XXXXXXXX-X)")
      .nullish(),
    email: z.email("Email inválido").nullish(),
    phone: z.string().nullish(),
    mobilePhone: z.string().nullish(),
    addressStreet: z.string().nullish(),
    addressCity: z.string().nullish(),
    addressState: z.string().nullish(),
    addressZip: z.string().nullish(),
    legalAddress: z.string().nullish(),
    appointedAddress: z.string().nullish(),
    notes: z.string().nullish(),
  })
  .refine(
    (data) => {
      // Persona física requiere nombre y apellido
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
      // Persona jurídica requiere razón social
      if (data.personType === personType.LEGAL_ENTITY) {
        return !!data.businessName && data.businessName.trim().length > 0;
      }
      return true;
    },
    { message: "La razón social es obligatoria para personas jurídicas", path: ["businessName"] }
  );

export const updatePersonSchema = z.object({
  personType: z.enum(personTypeValues, { error: "Tipo de persona inválido" }).optional(),
  firstName: z.string().min(1, "El nombre es obligatorio").optional(),
  lastName: z.string().min(1, "El apellido es obligatorio").optional(),
  businessName: z.string().nullish(),
  cuitCuil: z
    .string()
    .regex(CUIT_CUIL_REGEX, "Formato de CUIT/CUIL inválido (XX-XXXXXXXX-X)")
    .nullish(),
  email: z.email("Email inválido").nullish(),
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

export const queryPersonSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  personType: z.enum(personTypeValues).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  sort: z.enum(["last_name", "first_name", "created_at"]).default("last_name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});
