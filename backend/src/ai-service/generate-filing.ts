import Anthropic from "@anthropic-ai/sdk";
import { sendMessage, type LLMMessage } from "./llm-client";
import { SYSTEM_PROMPT_GENERATE_FILING } from "./prompts";
import * as caseService from "../services/case.service";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { movements } from "../models";

interface GenerateFilingResult {
  html: string;
  usage: { inputTokens: number; outputTokens: number };
}

export async function generateFiling(
  firmId: string,
  caseId: string,
  filingType: string,
  additionalInstructions?: string
): Promise<GenerateFilingResult> {
  // Fetch full case data
  const caseData = await caseService.findById(firmId, caseId);

  // Fetch recent movements for context
  const recentMovements = await db
    .select()
    .from(movements)
    .where(and(eq(movements.caseId, caseId), eq(movements.firmId, firmId)))
    .orderBy(desc(movements.movementDate))
    .limit(10);

  const systemPrompt =
    "Sos un abogado argentino experto en redacción de escritos judiciales. " +
    `Generá un escrito de tipo "${filingType}" para el expediente que se detalla a continuación. ` +
    "El escrito debe seguir las formalidades procesales argentinas, usar el estilo forense apropiado, " +
    `y dirigirse al juzgado ${caseData.court ? `"${caseData.court.name}"` : "interviniente"}. ` +
    "Estructura: encabezamiento con datos del expediente, objeto del escrito, desarrollo, petitorio. " +
    "Formato: HTML con párrafos (<p>), negrita (<strong>) para el encabezamiento y el petitorio. " +
    "No uses etiquetas <html>, <head> o <body> — solo el contenido del escrito.";

  const userContent =
    `Datos del expediente:\n${JSON.stringify(caseData, null, 2)}\n\n` +
    `Movimientos recientes:\n${JSON.stringify(recentMovements, null, 2)}` +
    (additionalInstructions ? `\n\nInstrucciones adicionales: ${additionalInstructions}` : "");

  const messages: LLMMessage[] = [
    { role: "user", content: userContent },
  ];

  const response = await sendMessage(systemPrompt, messages, undefined, 8192);

  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );
  const html = textBlocks.map((b) => b.text).join("\n");

  return {
    html,
    usage: { inputTokens: response.usage.inputTokens, outputTokens: response.usage.outputTokens },
  };
}
