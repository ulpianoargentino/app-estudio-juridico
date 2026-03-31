import Anthropic from "@anthropic-ai/sdk";
import { sendMessage, type LLMMessage } from "./llm-client";
import * as caseService from "../services/case.service";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { movements } from "../models";

export interface Suggestion {
  title: string;
  description: string;
  priority: "alta" | "media" | "baja";
  deadline?: string;
}

interface SuggestNextStepsResult {
  suggestions: Suggestion[];
  usage: { inputTokens: number; outputTokens: number };
}

export async function suggestNextSteps(
  firmId: string,
  caseId: string
): Promise<SuggestNextStepsResult> {
  const caseData = await caseService.findById(firmId, caseId);

  const recentMovements = await db
    .select()
    .from(movements)
    .where(and(eq(movements.caseId, caseId), eq(movements.firmId, firmId)))
    .orderBy(desc(movements.movementDate))
    .limit(15);

  const systemPrompt =
    "Sos un asistente jurídico especializado en derecho procesal argentino. " +
    "Dado el estado actual de este expediente, sugerí los próximos pasos procesales que el abogado debería tomar. " +
    "Sé específico: indicá qué escrito presentar, qué plazo corre, qué gestión realizar. " +
    "Ordená por prioridad.\n\n" +
    "Respondé ÚNICAMENTE con un JSON array válido con este formato, sin texto adicional ni markdown:\n" +
    '[{"title": "...", "description": "...", "priority": "alta|media|baja", "deadline": "fecha o null"}]';

  const userContent =
    `Datos del expediente:\n${JSON.stringify(caseData, null, 2)}\n\n` +
    `Movimientos recientes:\n${JSON.stringify(recentMovements, null, 2)}`;

  const messages: LLMMessage[] = [
    { role: "user", content: userContent },
  ];

  const response = await sendMessage(systemPrompt, messages);

  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );
  const rawText = textBlocks.map((b) => b.text).join("\n").trim();

  let suggestions: Suggestion[];
  try {
    // Try to parse the JSON, handling potential markdown code blocks
    const cleaned = rawText.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    suggestions = JSON.parse(cleaned);
  } catch {
    // If parsing fails, return a single suggestion with the raw text
    suggestions = [
      {
        title: "Sugerencias del asistente",
        description: rawText,
        priority: "media",
      },
    ];
  }

  return {
    suggestions,
    usage: { inputTokens: response.usage.inputTokens, outputTokens: response.usage.outputTokens },
  };
}
