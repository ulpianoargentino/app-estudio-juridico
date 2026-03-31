import { apiClient } from "./api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  caseId?: string;
  matterId?: string;
}

interface ChatResponse {
  response: string;
}

export async function sendChatMessage(data: ChatRequest): Promise<ChatResponse> {
  const res = await apiClient.post<ChatResponse>("/ai/chat", data);
  return res.data;
}
