import { apiClient } from "./api";

export interface MatterDetail {
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
  currency: string | null;
  notes: string | null;
  convertedToCaseId: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
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
}

export async function getMatter(id: string): Promise<MatterDetail> {
  const res = await apiClient.get(`/matters/${id}`);
  return res.data as MatterDetail;
}
