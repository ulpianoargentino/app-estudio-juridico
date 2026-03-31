import { z } from "zod/v4";

export const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1, "El mensaje no puede estar vacío"),
      })
    )
    .min(1, "Debe enviar al menos un mensaje"),
  caseId: z.string().optional(),
  matterId: z.string().optional(),
});
