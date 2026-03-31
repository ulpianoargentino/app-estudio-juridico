import { apiClient } from "./api";
import type { Movement, PaginatedResponse } from "@/types";

export interface MovementFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
}

export interface CreateMovementPayload {
  movementType: string;
  title: string;
  description?: string | null;
  occurredAt: string;
  volume?: string | null;
  page?: string | null;
}

export async function getMovements(
  caseId: string,
  filters: MovementFilters = {}
): Promise<PaginatedResponse<Movement>> {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.order) params.set("order", filters.order);

  const res = await apiClient.get(`/cases/${caseId}/movements?${params.toString()}`);
  return res.data as PaginatedResponse<Movement>;
}

export async function createMovement(
  caseId: string,
  data: CreateMovementPayload,
  file?: File
): Promise<Movement> {
  if (file) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (value != null) formData.append(key, String(value));
    }
    formData.append("file", file);
    const res = await apiClient.post(`/cases/${caseId}/movements`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data as Movement;
  }

  const res = await apiClient.post(`/cases/${caseId}/movements`, data);
  return res.data as Movement;
}

export async function updateMovement(
  caseId: string,
  movementId: string,
  data: Partial<CreateMovementPayload>
): Promise<Movement> {
  const res = await apiClient.put(`/cases/${caseId}/movements/${movementId}`, data);
  return res.data as Movement;
}

export async function deleteMovement(caseId: string, movementId: string): Promise<void> {
  await apiClient.delete(`/cases/${caseId}/movements/${movementId}`);
}
