import { apiClient } from "./api";
import type { CaseStatus, JurisdictionType, PartyRole } from "@/types";

export interface Court {
  id: string;
  name: string;
  clerkOffice: string | null;
  jurisdiction: string | null;
  address: string | null;
  phone: string | null;
}

export interface CaseParty {
  id: string;
  personId: string;
  role: PartyRole;
  firstName: string;
  lastName: string;
  businessName: string | null;
  personType: string;
}

export interface CaseSummary {
  id: string;
  firmId: string;
  caseNumber: string;
  caseTitle: string;
  jurisdictionType: JurisdictionType;
  status: CaseStatus;
  courtName: string | null;
  assignedAttorneyName: string | null;
  updatedAt: string;
}

export interface CaseDetail {
  id: string;
  firmId: string;
  caseNumber: string;
  caseTitle: string;
  jurisdictionType: JurisdictionType;
  jurisdiction: string | null;
  processType: string | null;
  status: CaseStatus;
  courtId: string | null;
  court: Court | null;
  clientPersonId: string | null;
  assignedAttorneyId: string | null;
  assignedAttorneyName: string | null;
  claimedAmount: number | null;
  currency: string | null;
  portalUrl: string | null;
  startDate: string | null;
  notes: string | null;
  parties: CaseParty[];
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface CaseFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  jurisdictionType?: string;
  assignedAttorneyId?: string;
  sort?: string;
  order?: string;
}

export interface PaginatedCases {
  data: CaseSummary[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export async function getCases(filters: CaseFilters = {}): Promise<PaginatedCases> {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.jurisdictionType) params.set("jurisdictionType", filters.jurisdictionType);
  if (filters.assignedAttorneyId) params.set("assignedAttorneyId", filters.assignedAttorneyId);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.order) params.set("order", filters.order);

  const res = await apiClient.get(`/cases?${params.toString()}`);
  return res.data as PaginatedCases;
}

export async function getCase(id: string): Promise<CaseDetail> {
  const res = await apiClient.get(`/cases/${id}`);
  return res.data as CaseDetail;
}

export async function createCase(data: Record<string, unknown>): Promise<CaseDetail> {
  const res = await apiClient.post("/cases", data);
  return res.data as CaseDetail;
}

export async function updateCase(id: string, data: Record<string, unknown>): Promise<CaseDetail> {
  const res = await apiClient.put(`/cases/${id}`, data);
  return res.data as CaseDetail;
}

export async function deleteCase(id: string): Promise<void> {
  await apiClient.delete(`/cases/${id}`);
}

export async function addParty(caseId: string, data: { personId: string; role: PartyRole }): Promise<CaseParty> {
  const res = await apiClient.post(`/cases/${caseId}/parties`, data);
  return res.data as CaseParty;
}

export async function removeParty(caseId: string, partyId: string): Promise<void> {
  await apiClient.delete(`/cases/${caseId}/parties/${partyId}`);
}

export interface FirmUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export async function getFirmUsers(): Promise<FirmUser[]> {
  const res = await apiClient.get("/users");
  return res.data as FirmUser[];
}

export async function searchCourts(query: string): Promise<Court[]> {
  const res = await apiClient.get(`/courts/search?q=${encodeURIComponent(query)}`);
  return res.data as Court[];
}
