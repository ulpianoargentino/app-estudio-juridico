import Anthropic from "@anthropic-ai/sdk";
import { sendMessage, type LLMMessage } from "./llm-client";
import { SYSTEM_PROMPT_ANALYZE_DOCUMENT } from "./prompts";
import * as caseService from "../services/case.service";

interface AnalyzeDocumentResult {
  analysis: string;
  usage: { inputTokens: number; outputTokens: number };
}

export async function analyzeDocument(
  firmId: string,
  documentContent: string,
  caseId?: string
): Promise<AnalyzeDocumentResult> {
  let caseContext = "";

  if (caseId) {
    try {
      const caseData = await caseService.findById(firmId, caseId);
      caseContext =
        "\n\nContexto del expediente vinculado:\n" +
        JSON.stringify(caseData, null, 2);
    } catch {
      // If case not found, proceed without context
    }
  }

  const systemPrompt =
    "Sos un asistente jurídico especializado en análisis de documentos legales argentinos. " +
    "Analizá el documento proporcionado e identificá: tipo de documento, partes mencionadas, " +
    "fechas relevantes, obligaciones, plazos, y cualquier punto que requiera atención del abogado. " +
    "Si hay un expediente de contexto, relacioná los hallazgos con el caso. " +
    "Respondé en español de forma estructurada usando markdown." +
    caseContext;

  const messages: LLMMessage[] = [
    { role: "user", content: `Documento a analizar:\n\n${documentContent}` },
  ];

  const response = await sendMessage(systemPrompt, messages, undefined, 4096);

  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );
  const analysis = textBlocks.map((b) => b.text).join("\n");

  return {
    analysis,
    usage: { inputTokens: response.usage.inputTokens, outputTokens: response.usage.outputTokens },
  };
}
