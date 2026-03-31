import { apiClient } from "./api";

export interface CaseReportRow {
  id: string;
  caseNumber: string | null;
  caseTitle: string;
  jurisdictionType: string;
  status: string;
  startDate: string | null;
  claimedAmount: string | null;
  currency: string | null;
  updatedAt: string;
  courtName: string | null;
  responsibleAttorneyName: string | null;
  primaryClientName: string | null;
}

export interface CasesReportFilters {
  page?: number;
  limit?: number;
  export?: boolean;
  status?: string[];
  jurisdictionType?: string[];
  responsibleAttorneyId?: string;
  primaryClientId?: string;
  courtId?: string;
  startDateFrom?: string;
  startDateTo?: string;
  claimedAmountMin?: number;
  claimedAmountMax?: number;
  isActive?: boolean;
  sort?: string;
  order?: string;
}

export interface CasesReportResponse {
  data: CaseReportRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export async function getCasesReport(filters: CasesReportFilters = {}): Promise<CasesReportResponse> {
  const params = buildCasesParams(filters);
  const res = await apiClient.get(`/reports/cases?${params.toString()}`);
  return res.data as CasesReportResponse;
}

export async function downloadCasesExport(filters: CasesReportFilters = {}): Promise<void> {
  const params = buildCasesParams(filters);
  params.set("format", "csv");
  const res = await apiClient.get(`/reports/cases/export?${params.toString()}`, {
    responseType: "blob",
  });
  const blob = new Blob([res.data as BlobPart], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "expedientes.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function buildCasesParams(filters: CasesReportFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.export) params.set("export", "true");
  if (filters.status && filters.status.length > 0) params.set("status", filters.status.join(","));
  if (filters.jurisdictionType && filters.jurisdictionType.length > 0) params.set("jurisdictionType", filters.jurisdictionType.join(","));
  if (filters.responsibleAttorneyId) params.set("responsibleAttorneyId", filters.responsibleAttorneyId);
  if (filters.primaryClientId) params.set("primaryClientId", filters.primaryClientId);
  if (filters.courtId) params.set("courtId", filters.courtId);
  if (filters.startDateFrom) params.set("startDateFrom", filters.startDateFrom);
  if (filters.startDateTo) params.set("startDateTo", filters.startDateTo);
  if (filters.claimedAmountMin !== undefined) params.set("claimedAmountMin", String(filters.claimedAmountMin));
  if (filters.claimedAmountMax !== undefined) params.set("claimedAmountMax", String(filters.claimedAmountMax));
  if (filters.isActive !== undefined) params.set("isActive", String(filters.isActive));
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.order) params.set("order", filters.order);
  return params;
}

// Deadlines

export interface DeadlineRow {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  status: string;
  assignedToName: string | null;
  caseId: string | null;
  matterId: string | null;
  linkedName: string | null;
  linkedNumber: string | null;
  isOverdue: boolean;
}

export interface DeadlinesFilters {
  days: number;
  assignedToId?: string;
}

export async function getDeadlinesReport(filters: DeadlinesFilters): Promise<DeadlineRow[]> {
  const params = new URLSearchParams();
  params.set("days", String(filters.days));
  if (filters.assignedToId) params.set("assignedToId", filters.assignedToId);
  const res = await apiClient.get(`/reports/deadlines?${params.toString()}`);
  return res.data as DeadlineRow[];
}

// Errands

export interface ErrandRow {
  id: string;
  errandType: string;
  status: string;
  dueDate: string | null;
  completedDate: string | null;
  notes: string | null;
  caseId: string | null;
  caseCaseNumber: string | null;
  caseCaseTitle: string | null;
  responsibleName: string | null;
}

export interface ErrandsFilters {
  errandType?: string;
  responsibleId?: string;
  status?: string;
}

export async function getErrandsReport(filters: ErrandsFilters = {}): Promise<ErrandRow[]> {
  const params = new URLSearchParams();
  if (filters.errandType) params.set("errandType", filters.errandType);
  if (filters.responsibleId) params.set("responsibleId", filters.responsibleId);
  if (filters.status) params.set("status", filters.status);
  const res = await apiClient.get(`/reports/errands?${params.toString()}`);
  return res.data as ErrandRow[];
}
