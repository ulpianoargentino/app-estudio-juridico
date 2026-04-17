import { z } from "zod/v4";
import { idSchema, auditFieldsSchema } from "./common";
import { partyRole, personType, enumValues } from "./enums";

// POST /api/cases/:caseId/parties y /api/matters/:matterId/parties
export const partyCreateSchema = z.object({
  personId: idSchema.min(1, "La persona es obligatoria"),
  role: z.enum(enumValues(partyRole), { error: "Rol inválido" }),
  notes: z.string().nullish(),
});
export type PartyCreateInput = z.infer<typeof partyCreateSchema>;

// Record raw del party (lo que devuelve el POST).
export const partyResponseSchema = z.object({
  id: idSchema,
  firmId: idSchema,
  personId: idSchema,
  caseId: idSchema.nullable(),
  matterId: idSchema.nullable(),
  role: z.enum(enumValues(partyRole)),
  notes: z.string().nullable(),
  ...auditFieldsSchema.shape,
});
export type Party = z.infer<typeof partyResponseSchema>;

// GET /api/cases/:caseId/parties y /api/matters/:matterId/parties
// Row enriquecida con datos de la persona. Ver party.service.ts.
export const partyListItemSchema = z.object({
  id: idSchema,
  role: z.enum(enumValues(partyRole)),
  notes: z.string().nullable(),
  personId: idSchema,
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  businessName: z.string().nullable(),
  personType: z.enum(enumValues(personType)).nullable(),
  cuitCuil: z.string().nullable(),
  email: z.string().nullable(),
});
export type PartyListItem = z.infer<typeof partyListItemSchema>;
