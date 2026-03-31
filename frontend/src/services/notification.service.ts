import { apiClient } from "./api";

export interface Notification {
  id: string;
  firmId: string;
  userId: string;
  title: string;
  message: string;
  notificationType: string;
  referenceType: string | null;
  referenceId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface PaginatedNotifications {
  data: Notification[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export async function getNotifications(filters: NotificationFilters = {}): Promise<PaginatedNotifications> {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.unreadOnly) params.set("unreadOnly", "true");

  const res = await apiClient.get(`/notifications?${params.toString()}`);
  return res.data as PaginatedNotifications;
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiClient.get("/notifications/count");
  return (res.data as { count: number }).count;
}

export async function markAsRead(id: string): Promise<Notification> {
  const res = await apiClient.patch(`/notifications/${id}/read`);
  return res.data as Notification;
}

export async function markAllAsRead(): Promise<void> {
  await apiClient.patch("/notifications/read-all");
}
