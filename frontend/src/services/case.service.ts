import { apiClient } from "./api";
import type {
  Case,
  CaseCreateInput,
  CaseUpdateInput,
  CaseListItem,
  CaseDetail,
} from "@shared";

// El interceptor de `api.ts` desenvuelve el envelope `{ data: T }` del backend.
// Los listados del backend devuelven `{ data: [...], meta: ... }`; tras el
// interceptor llega sólo el array de items. Paginación se suma en tareas futuras.

export async function listCases(isActive: boolean = true): Promise<CaseListItem[]> {
  const res = await apiClient.get<CaseListItem[]>("/cases", {
    params: { isActive: isActive ? "true" : "false", sort: "case_title", order: "asc", limit: 100 },
  });
  return res.data;
}

export async function getCase(id: string): Promise<CaseDetail> {
  const res = await apiClient.get<CaseDetail>(`/cases/${id}`);
  return res.data;
}

export async function createCase(input: CaseCreateInput): Promise<Case> {
  const res = await apiClient.post<Case>("/cases", input);
  return res.data;
}

export async function updateCase(id: string, input: CaseUpdateInput): Promise<Case> {
  const res = await apiClient.put<Case>(`/cases/${id}`, input);
  return res.data;
}

export async function archiveCase(id: string): Promise<void> {
  await apiClient.post(`/cases/${id}/archive`);
}

export async function unarchiveCase(id: string): Promise<void> {
  await apiClient.post(`/cases/${id}/unarchive`);
}
