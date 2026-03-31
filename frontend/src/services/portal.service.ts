import { apiClient } from "./api";

export interface PortalCredential {
  id: string;
  portal: string;
  username: string;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalSyncResult {
  portal: string;
  credentialId: string;
  success: boolean;
  casesScraped: number;
  newMovementsFound: number;
  error?: string;
}

export interface SyncLog {
  id: string;
  firmId: string;
  credentialId: string;
  portal: string;
  startedAt: string;
  finishedAt: string | null;
  success: boolean | null;
  casesScraped: number;
  newMovementsFound: number;
  errorMessage: string | null;
}

export async function getCredentials(): Promise<PortalCredential[]> {
  const res = await apiClient.get<PortalCredential[]>("/portals/credentials");
  return res.data;
}

export async function createCredential(data: {
  portal: string;
  username: string;
  password: string;
}): Promise<PortalCredential> {
  const res = await apiClient.post<PortalCredential>("/portals/credentials", data);
  return res.data;
}

export async function updateCredential(
  id: string,
  data: { username?: string; password?: string }
): Promise<PortalCredential> {
  const res = await apiClient.put<PortalCredential>(`/portals/credentials/${id}`, data);
  return res.data;
}

export async function deleteCredential(id: string): Promise<void> {
  await apiClient.delete(`/portals/credentials/${id}`);
}

export async function toggleCredentialActive(
  id: string,
  isActive: boolean
): Promise<PortalCredential> {
  const res = await apiClient.patch<PortalCredential>(
    `/portals/credentials/${id}/active`,
    { isActive }
  );
  return res.data;
}

export async function syncAll(): Promise<PortalSyncResult[]> {
  const res = await apiClient.post<PortalSyncResult[]>("/portals/sync");
  return res.data;
}

export async function syncOne(credentialId: string): Promise<PortalSyncResult> {
  const res = await apiClient.post<PortalSyncResult>(`/portals/sync/${credentialId}`);
  return res.data;
}

export async function getSyncLogs(
  credentialId?: string,
  limit = 20
): Promise<SyncLog[]> {
  const params: Record<string, string> = {};
  if (credentialId) params.credentialId = credentialId;
  params.limit = String(limit);
  const res = await apiClient.get<SyncLog[]>("/portals/sync/logs", { params });
  return res.data;
}
