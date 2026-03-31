import { apiClient } from "./api";

export interface CaseDetail {
  id: string;
  firmId: string;
  caseNumber: string | null;
  caseTitle: string;
  jurisdictionType: string;
  jurisdiction: string | null;
  courtId: string | null;
  processType: string | null;
  status: string;
  primaryClientId: string | null;
  responsibleAttorneyId: string | null;
  startDate: string | null;
  claimedAmount: string | null;
  currency: string | null;
  portalUrl: string | null;
  notes: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  court: { id: string; name: string; clerkOffice: string | null } | null;
  primaryClient: { id: string; firstName: string; lastName: string; businessName: string | null; personType: string } | null;
  responsibleAttorney: { id: string; firstName: string; lastName: string; email: string } | null;
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
  upcomingEventCount: number;
}

export async function getCase(id: string): Promise<CaseDetail> {
  const res = await apiClient.get(`/cases/${id}`);
  return res.data as CaseDetail;
}
