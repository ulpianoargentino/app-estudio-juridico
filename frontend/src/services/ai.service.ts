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

// Generate filing

interface GenerateFilingRequest {
  caseId: string;
  filingType: string;
  instructions?: string;
}

interface GenerateFilingResponse {
  html: string;
}

export async function generateFiling(data: GenerateFilingRequest): Promise<GenerateFilingResponse> {
  const res = await apiClient.post<GenerateFilingResponse>("/ai/generate-filing", data);
  return res.data;
}

// Suggest next steps

export interface Suggestion {
  title: string;
  description: string;
  priority: "alta" | "media" | "baja";
  deadline?: string;
}

interface SuggestNextStepsResponse {
  suggestions: Suggestion[];
}

export async function suggestNextSteps(caseId: string): Promise<SuggestNextStepsResponse> {
  const res = await apiClient.post<SuggestNextStepsResponse>("/ai/suggest-next-steps", { caseId });
  return res.data;
}

// Analyze document

interface AnalyzeDocumentRequest {
  documentContent: string;
  caseId?: string;
}

interface AnalyzeDocumentResponse {
  analysis: string;
}

export async function analyzeDocumentAI(data: AnalyzeDocumentRequest): Promise<AnalyzeDocumentResponse> {
  const res = await apiClient.post<AnalyzeDocumentResponse>("/ai/analyze-document", data);
  return res.data;
}
