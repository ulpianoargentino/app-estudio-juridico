import Anthropic from "@anthropic-ai/sdk";
import { sendMessage, type LLMMessage } from "./llm-client";
import { allTools } from "./tools";
import { executeTool } from "./tool-executor";
import { buildContextualSystemPrompt } from "./prompts";
import * as caseService from "../services/case.service";
import * as matterService from "../services/matter.service";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ContextualChatResult {
  reply: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

const MAX_TOOL_ROUNDS = 10;

/**
 * Chat contextual con el asistente de IA.
 * Ejecuta el loop de tool_use hasta que el LLM responda con texto.
 */
export async function contextualChat(
  firmId: string,
  messages: ChatMessage[],
  caseId?: string,
  matterId?: string
): Promise<ContextualChatResult> {
  // Load context if a case or matter is provided
  let caseContext: unknown = undefined;
  let matterContext: unknown = undefined;

  if (caseId) {
    try {
      caseContext = await caseService.findById(firmId, caseId);
    } catch {
      // If case not found, proceed without context
    }
  }

  if (matterId) {
    try {
      matterContext = await matterService.findById(firmId, matterId);
    } catch {
      // If matter not found, proceed without context
    }
  }

  const systemPrompt = buildContextualSystemPrompt(caseContext, matterContext);

  // Convert chat messages to LLM format
  const llmMessages: LLMMessage[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // Tool use loop
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await sendMessage(systemPrompt, llmMessages, allTools);
    totalInputTokens += response.usage.inputTokens;
    totalOutputTokens += response.usage.outputTokens;

    if (response.stopReason === "end_turn" || response.stopReason !== "tool_use") {
      // Extract text from content blocks
      const textBlocks = response.content.filter(
        (block): block is Anthropic.TextBlock => block.type === "text"
      );
      const reply = textBlocks.map((b) => b.text).join("\n");

      return {
        reply,
        usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
      };
    }

    // Process tool calls
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    // Add the assistant's response (with tool_use blocks) to messages
    llmMessages.push({
      role: "assistant",
      content: response.content,
    });

    // Execute each tool and add results
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUseBlocks) {
      const result = await executeTool(
        toolUse.name,
        toolUse.input as Record<string, unknown>,
        firmId
      );
      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: JSON.stringify(result),
      });
    }

    llmMessages.push({
      role: "user",
      content: toolResults as unknown as string,
    });
  }

  // Safety fallback: if we exhaust tool rounds
  return {
    reply: "Lo siento, no pude completar la consulta. Por favor, intentá reformular tu pregunta.",
    usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
  };
}
