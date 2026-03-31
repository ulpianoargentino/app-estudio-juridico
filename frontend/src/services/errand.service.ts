import { apiClient } from "./api";
import type { Errand, PaginatedResponse } from "@/types";

export interface ErrandFilters {
  page?: number;
  limit?: number;
  status?: string;
  sort?: string;
  order?: string;
}

export interface CreateErrandPayload {
  errandType: string;
  status: string;
  assigneeId?: string | null;
  dueAt?: string | null;
  notes?: string | null;
  createReminder?: boolean;
}

export async function getErrands(
  caseId: string,
  filters: ErrandFilters = {}
): Promise<PaginatedResponse<Errand>> {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.status) params.set("status", filters.status);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.order) params.set("order", filters.order);

  const res = await apiClient.get(`/cases/${caseId}/errands?${params.toString()}`);
  return res.data as PaginatedResponse<Errand>;
}

export async function createErrand(
  caseId: string,
  data: CreateErrandPayload
): Promise<Errand> {
  const res = await apiClient.post(`/cases/${caseId}/errands`, data);
  return res.data as Errand;
}

export async function updateErrand(
  caseId: string,
  errandId: string,
  data: Partial<CreateErrandPayload>
): Promise<Errand> {
  const res = await apiClient.put(`/cases/${caseId}/errands/${errandId}`, data);
  return res.data as Errand;
}

export async function markErrandCompleted(
  caseId: string,
  errandId: string
): Promise<Errand> {
  const res = await apiClient.put(`/cases/${caseId}/errands/${errandId}`, {
    status: "COMPLETED",
    completedAt: new Date().toISOString(),
  });
  return res.data as Errand;
}

export async function deleteErrand(caseId: string, errandId: string): Promise<void> {
  await apiClient.delete(`/cases/${caseId}/errands/${errandId}`);
}
