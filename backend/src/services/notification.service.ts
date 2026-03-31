import { eq, and, desc, count } from "drizzle-orm";
import { db } from "../db";
import { notifications } from "../models";
import { uuidv7 } from "../utils/uuid";
import { AppError } from "../middleware/error-handler";

interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  notificationType: string;
  referenceType?: string | null;
  referenceId?: string | null;
}

interface FindByUserFilters {
  isRead?: boolean;
  limit: number;
  page: number;
}

export async function create(firmId: string, data: CreateNotificationData) {
  const id = uuidv7();
  const [created] = await db
    .insert(notifications)
    .values({
      id,
      firmId,
      userId: data.userId,
      title: data.title,
      message: data.message,
      notificationType: data.notificationType,
      referenceType: data.referenceType ?? null,
      referenceId: data.referenceId ?? null,
    })
    .returning();

  return created!;
}

export async function findByUser(firmId: string, userId: string, filters: FindByUserFilters) {
  const conditions = [
    eq(notifications.firmId, firmId),
    eq(notifications.userId, userId),
  ];

  if (filters.isRead !== undefined) {
    conditions.push(eq(notifications.isRead, filters.isRead));
  }

  const where = and(...conditions);
  const offset = (filters.page - 1) * filters.limit;

  const [data, totalResult] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .limit(filters.limit)
      .offset(offset),
    db.select({ count: count() }).from(notifications).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return {
    data,
    meta: {
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function markAsRead(firmId: string, notificationId: string, userId: string) {
  const [existing] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.firmId, firmId),
        eq(notifications.userId, userId),
      )
    )
    .limit(1);

  if (!existing) throw new AppError(404, "NOTIFICATION_NOT_FOUND", "Notificación no encontrada");

  const [updated] = await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.firmId, firmId),
        eq(notifications.userId, userId),
      )
    )
    .returning();

  return updated!;
}

export async function markAllAsRead(firmId: string, userId: string) {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.firmId, firmId),
        eq(notifications.userId, userId),
        eq(notifications.isRead, false),
      )
    );
}

export async function countUnread(firmId: string, userId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.firmId, firmId),
        eq(notifications.userId, userId),
        eq(notifications.isRead, false),
      )
    );

  return result?.count ?? 0;
}
