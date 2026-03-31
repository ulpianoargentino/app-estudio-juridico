import { apiClient } from "./api";

export interface Firm {
  id: string;
  name: string;
  logoUrl: string | null;
  accentColor: string | null;
}

export async function getFirm(): Promise<Firm> {
  const res = await apiClient.get<Firm>("/firms/me");
  return res.data;
}

export async function updateFirm(data: {
  name?: string;
  logoUrl?: string | null;
  accentColor?: string | null;
}): Promise<Firm> {
  const res = await apiClient.put<Firm>("/firms/me", data);
  return res.data;
}
