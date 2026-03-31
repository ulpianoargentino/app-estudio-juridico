import { z } from "zod/v4";
import { portal } from "../models/enums";

const portalValues = Object.values(portal) as [string, ...string[]];

export const createPortalCredentialSchema = z.object({
  portal: z.enum(portalValues, { error: "Portal inválido" }),
  username: z.string().min(1, "El usuario es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const updatePortalCredentialSchema = z.object({
  portal: z.enum(portalValues, { error: "Portal inválido" }).optional(),
  username: z.string().min(1, "El usuario es obligatorio").optional(),
  password: z.string().min(1, "La contraseña es obligatoria").optional(),
});

export const toggleActiveSchema = z.object({
  isActive: z.boolean({ error: "isActive debe ser un booleano" }),
});

export const syncLogsQuerySchema = z.object({
  credentialId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
