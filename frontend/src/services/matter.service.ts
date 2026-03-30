import { apiClient } from "./api";

export interface Matter {
  id: string;
  firmId: string;
  title: string;
  matterType: string;
  status: string;
  primaryClientId: string | null;
  opposingPartyId: string | null;
  responsibleAttorneyId: string | null;
  startDate: string | null;
  estimatedFee: string | null;
  currency: string;
  notes: string | null;
  convertedToCaseId: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  primaryClientName?: string | null;
  responsibleAttorneyName?: string | null;
}

export interface MatterDetail extends Matter {
  primaryClient: {
    id: string;
    firstName: string;
    lastName: string;
    businessName: string | null;
    personType: string;
  } | null;
  responsibleAttorney: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  parties: Array<{
    id: string;
    role: string;
    notes: string | null;
    personId: string;
    firstName: string;
    lastName: string;
    businessName: string | null;
    personType: string;
  }>;
  movementCount: number;
  documentCount: number;
}

export interface MatterFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  matterType?: string;
  responsibleAttorneyId?: string;
  primaryClientId?: string;
  sort?: string;
  order?: string;
}

export interface PaginatedResponse {
  data: Matter[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export async function getMatters(filters: MatterFilters = {}): Promise<PaginatedResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.matterType) params.set("matterType", filters.matterType);
  if (filters.responsibleAttorneyId) params.set("responsibleAttorneyId", filters.responsibleAttorneyId);
  if (filters.primaryClientId) params.set("primaryClientId", filters.primaryClientId);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.order) params.set("order", filters.order);

  const res = await apiClient.get(`/matters?${params.toString()}`);
  return res.data as PaginatedResponse;
}

export async function getMatter(id: string): Promise<MatterDetail> {
  const res = await apiClient.get(`/matters/${id}`);
  return res.data as MatterDetail;
}

export async function createMatter(data: Record<string, unknown>): Promise<Matter> {
  const res = await apiClient.post("/matters", data);
  return res.data as Matter;
}

export async function updateMatter(id: string, data: Record<string, unknown>): Promise<Matter> {
  const res = await apiClient.put(`/matters/${id}`, data);
  return res.data as Matter;
}

export async function deleteMatter(id: string): Promise<void> {
  await apiClient.delete(`/matters/${id}`);
}

export async function convertMatterToCase(id: string, data: Record<string, unknown>): Promise<unknown> {
  const res = await apiClient.post(`/matters/${id}/convert`, data);
  return res.data;
}
