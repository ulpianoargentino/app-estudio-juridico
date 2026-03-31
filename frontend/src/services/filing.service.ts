import { apiClient } from "./api";

export interface Template {
  id: string;
  name: string;
  category: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

export interface RenderResult {
  html: string;
  templateName: string;
  caseTitle: string;
  variables: Record<string, string>;
}

export interface SaveResult {
  movementId: string;
  documentId: string;
  pdfDocumentId?: string;
}

export interface CaseListItem {
  id: string;
  caseTitle: string;
  caseNumber: string | null;
  status: string;
  jurisdictionType: string;
}

export async function getTemplates(params?: { category?: string; search?: string }) {
  const { data } = await apiClient.get<Template[]>("/templates", { params });
  return data;
}

export async function renderTemplate(templateId: string, caseId: string) {
  const { data } = await apiClient.post<RenderResult>(`/templates/${templateId}/render`, { caseId });
  return data;
}

export async function getCases(params?: { search?: string }) {
  const response = await apiClient.get<{ data: CaseListItem[]; meta: unknown }>("/cases", {
    params: { ...params, limit: 100 },
  });
  // Paginated response is not unwrapped by interceptor
  return response.data.data;
}

export async function generatePdf(html: string, options?: Record<string, unknown>) {
  const response = await apiClient.post("/filings/generate-pdf", { html, options }, {
    responseType: "blob",
  });
  return response.data as Blob;
}

export async function saveFiling(data: {
  caseId: string;
  title: string;
  html: string;
  generatePdf?: boolean;
}) {
  const { data: result } = await apiClient.post<SaveResult>("/filings/save", data);
  return result;
}
