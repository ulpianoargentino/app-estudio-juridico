import { apiClient } from "./api";
import type { Case } from "@/types";

export interface CaseDetail extends Case {
  courtName: string | null;
  clerkOfficeName: string | null;
  jurisdictionName: string | null;
}

export async function getCase(id: string): Promise<CaseDetail> {
  const res = await apiClient.get(`/cases/${id}`);
  return res.data as CaseDetail;
}

export interface FirmUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export async function getFirmUsers(): Promise<FirmUser[]> {
  const res = await apiClient.get("/users");
  return res.data as FirmUser[];
}
