import { apiClient } from "./api";
import type { Document, PaginatedResponse } from "@/types";

export interface DocumentFilters {
  page?: number;
  limit?: number;
  caseId?: string;
  matterId?: string;
  category?: string;
  sort?: string;
  order?: string;
}

export async function getDocuments(filters: DocumentFilters = {}): Promise<PaginatedResponse<Document>> {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.caseId) params.set("caseId", filters.caseId);
  if (filters.matterId) params.set("matterId", filters.matterId);
  if (filters.category) params.set("category", filters.category);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.order) params.set("order", filters.order);

  const res = await apiClient.get(`/documents?${params.toString()}`);
  return res.data as PaginatedResponse<Document>;
}

export async function createDocument(data: {
  caseId?: string | null;
  matterId?: string | null;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  category: string;
  notes?: string | null;
}): Promise<Document> {
  const res = await apiClient.post("/documents", data);
  return res.data as Document;
}

export async function deleteDocument(id: string): Promise<void> {
  await apiClient.delete(`/documents/${id}`);
}

export async function uploadFile(file: File, onProgress?: (pct: number) => void): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiClient.post("/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
  return res.data as { url: string };
}
