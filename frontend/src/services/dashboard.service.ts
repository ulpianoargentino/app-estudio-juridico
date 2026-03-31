import { apiClient } from "./api";

export interface DashboardEvent {
  id: string;
  eventType: string;
  title: string;
  eventDate: string;
  eventTime: string | null;
  caseId: string | null;
  matterId: string | null;
  status: string;
  caseNumber: string | null;
  caseTitle: string | null;
  matterTitle: string | null;
}

export interface DashboardMovement {
  id: string;
  movementDate: string;
  movementType: string;
  description: string;
  caseId: string | null;
  matterId: string | null;
  caseNumber: string | null;
  caseTitle: string | null;
  matterTitle: string | null;
}

export interface DashboardStats {
  totalActiveCases: number;
  casesByStatus: Record<string, number>;
  casesByJurisdictionType: Record<string, number>;
  totalActiveMatters: number;
  upcomingEvents: DashboardEvent[];
  upcomingDeadlines: DashboardEvent[];
  recentMovements: DashboardMovement[];
  totalClaimedAmount: string;
  pendingErrands: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get("/dashboard/stats");
  return data;
}
