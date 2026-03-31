// AI service abstraction layer.
// The rest of the application NEVER calls the Anthropic API directly.
// All AI interactions go through this service.

export { sendMessage } from "./llm-client";
export type { LLMMessage, LLMTool, LLMResponse } from "./llm-client";

export { allTools } from "./tools";

export { executeTool } from "./tool-executor";

export {
  SYSTEM_PROMPT_CONTEXTUAL_CHAT,
  SYSTEM_PROMPT_GENERATE_FILING,
  SYSTEM_PROMPT_ANALYZE_DOCUMENT,
  SYSTEM_PROMPT_SEARCH_JURISPRUDENCE,
  SYSTEM_PROMPT_SUGGEST_NEXT_STEPS,
  SYSTEM_PROMPT_ALERT_EXPIRATION,
  buildContextualSystemPrompt,
} from "./prompts";

export { contextualChat } from "./contextual-chat";
export { generateFiling } from "./generate-filing";
export { suggestNextSteps } from "./suggest-next-steps";
export type { Suggestion } from "./suggest-next-steps";
export { analyzeDocument } from "./analyze-document";
