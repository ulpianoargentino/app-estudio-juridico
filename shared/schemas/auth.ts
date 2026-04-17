import { z } from "zod/v4";
import { authUserSchema } from "./user";

export const loginRequestSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const registerRequestSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  firmName: z.string().min(1, "El nombre del estudio es obligatorio"),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

// /auth/login y /auth/register responden con { data: { user: AuthUser } }.
// El envelope externo { data } lo maneja el interceptor del frontend — acá
// modelamos el payload interno.
export const authResponseSchema = z.object({
  user: authUserSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

// /auth/logout responde con { data: { message: string } }
export const logoutResponseSchema = z.object({
  message: z.string(),
});
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;
