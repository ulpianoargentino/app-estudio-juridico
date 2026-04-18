import { apiClient } from "./api";
import type { Court, CourtCreateInput } from "@shared";

export async function listCourts(): Promise<Court[]> {
  const res = await apiClient.get<Court[]>("/courts", {
    params: { sort: "name", order: "asc", limit: 100 },
  });
  return res.data;
}

export async function getCourt(id: string): Promise<Court> {
  const res = await apiClient.get<Court>(`/courts/${id}`);
  return res.data;
}

export async function createCourt(input: CourtCreateInput): Promise<Court> {
  const res = await apiClient.post<Court>("/courts", input);
  return res.data;
}
