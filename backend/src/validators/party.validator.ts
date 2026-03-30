import { z } from "zod/v4";
import { partyRole } from "../models/enums";

const partyRoleValues = Object.values(partyRole) as [string, ...string[]];

export const addPartySchema = z.object({
  personId: z.string().min(1, "La persona es obligatoria"),
  role: z.enum(partyRoleValues, { error: "Rol inválido" }),
  notes: z.string().nullish(),
});
