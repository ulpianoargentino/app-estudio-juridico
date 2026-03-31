import { apiClient } from "./api";
import type { Event } from "@/types";

export interface EventFilters {
  startDate?: string;
  endDate?: string;
  eventType?: string;
  assignedToId?: string;
}

export interface EventsResponse {
  data: Event[];
}

export async function getEvents(filters: EventFilters = {}): Promise<Event[]> {
  const params = new URLSearchParams();
  if (filters.startDate) params.set("start_date", filters.startDate);
  if (filters.endDate) params.set("end_date", filters.endDate);
  if (filters.eventType) params.set("event_type", filters.eventType);
  if (filters.assignedToId) params.set("assigned_to_id", filters.assignedToId);

  const res = await apiClient.get(`/events?${params.toString()}`);
  // The interceptor unwraps { data: T } for non-paginated responses
  return (Array.isArray(res.data) ? res.data : []) as Event[];
}

export async function getEvent(id: string): Promise<Event> {
  const res = await apiClient.get(`/events/${id}`);
  return res.data as Event;
}

export async function createEvent(data: Record<string, unknown>): Promise<Event> {
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
