import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS_DEFAULT = 4096;

const client = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

function getModel(): string {
  return process.env.AI_MODEL || DEFAULT_MODEL;
}

export interface LLMMessage {
  role: "user" | "assistant";
  content: string | Anthropic.ContentBlock[];
}

export interface LLMTool {
  name: string;
  description: string;
  input_schema: Anthropic.Tool["input_schema"];
}

export interface LLMResponse {
  content: Anthropic.ContentBlock[];
  stopReason: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export async function sendMessage(
  systemPrompt: string,
  messages: LLMMessage[],
  tools?: LLMTool[],
  maxTokens?: number
): Promise<LLMResponse> {
  const params: Anthropic.MessageCreateParams = {
    model: getModel(),
    max_tokens: maxTokens ?? MAX_TOKENS_DEFAULT,
    system: systemPrompt,
    messages: messages as Anthropic.MessageParam[],
  };

  if (tools && tools.length > 0) {
    params.tools = tools as Anthropic.Tool[];
  }

  let response: Anthropic.Message;
  try {
    response = await client.messages.create(params);
  } catch (error: unknown) {
    // Retry once on network errors
    if (isNetworkError(error)) {
      console.warn("[ai-service] Network error, retrying once...", (error as Error).message);
      try {
        response = await client.messages.create(params);
      } catch (retryError: unknown) {
        console.error("[ai-service] Retry failed:", (retryError as Error).message);
        throw retryError;
      }
    } else {
      console.error("[ai-service] LLM request failed:", (error as Error).message);
      throw error;
    }
  }

  return {
    content: response.content,
    stopReason: response.stop_reason,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof Anthropic.APIConnectionError) return true;
  if (error instanceof Anthropic.InternalServerError) return true;
  if (error instanceof Anthropic.RateLimitError) return true;
  return false;
}
