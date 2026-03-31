import { apiClient } from "./api";
import type { Event, PaginatedResponse } from "@/types";

export interface EventFilters {
  page?: number;
  limit?: number;
  caseId?: string;
  matterId?: string;
  eventType?: string;
  status?: string;
  sort?: string;
  order?: string;
}

export async function getEvents(filters: EventFilters = {}): Promise<PaginatedResponse<Event>> {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.caseId) params.set("caseId", filters.caseId);
  if (filters.matterId) params.set("matterId", filters.matterId);
  if (filters.eventType) params.set("eventType", filters.eventType);
  if (filters.status) params.set("status", filters.status);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.order) params.set("order", filters.order);

  const res = await apiClient.get(`/events?${params.toString()}`);
  return res.data as PaginatedResponse<Event>;
}

export async function createEvent(data: {
  caseId?: string | null;
  matterId?: string | null;
  eventType: string;
  title: string;
  description?: string | null;
  eventDate: string;
  eventTime?: string | null;
  isAllDay: boolean;
  assignedToId?: string | null;
  status?: string;
}): Promise<Event> {
  const res = await apiClient.post("/events", data);
  return res.data as Event;
}

export async function updateEvent(id: string, data: Record<string, unknown>): Promise<Event> {
  const res = await apiClient.put(`/events/${id}`, data);
  return res.data as Event;
}

export async function deleteEvent(id: string): Promise<void> {
  await apiClient.delete(`/events/${id}`);
}
