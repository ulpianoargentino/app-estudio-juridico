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

export const generateFilingSchema = z.object({
  caseId: z.string().min(1, "El expediente es obligatorio"),
  filingType: z.string().min(1, "El tipo de escrito es obligatorio"),
  instructions: z.string().optional(),
});

export const suggestNextStepsSchema = z.object({
  caseId: z.string().min(1, "El expediente es obligatorio"),
});

export const analyzeDocumentSchema = z.object({
  documentContent: z.string().min(1, "El contenido del documento es obligatorio"),
  caseId: z.string().optional(),
});
