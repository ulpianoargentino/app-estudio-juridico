import { eq, and, asc, desc, count } from "drizzle-orm";
import { db } from "../db";
import { events, users } from "../models";
import { uuidv7 } from "../utils/uuid";
import { AppError } from "../middleware/error-handler";

interface CreateEventData {
  caseId?: string | null;
  matterId?: string | null;
  eventType: string;
  title: string;
  description?: string | null;
  eventDate: Date;
  eventTime?: string | null;
  endDate?: Date | null;
  endTime?: string | null;
  isAllDay: boolean;
  assignedToId?: string | null;
  status: string;
  reminderMinutesBefore?: number | null;
}

interface FindAllFilters {
  page: number;
  limit: number;
  caseId?: string;
  matterId?: string;
  eventType?: string;
  status?: string;
  sort: string;
  order: string;
}

const sortColumns = {
  event_date: events.eventDate,
  created_at: events.createdAt,
  title: events.title,
} as const;

export async function create(firmId: string, data: CreateEventData, userId: string) {
  if (data.assignedToId) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, data.assignedToId), eq(users.firmId, firmId)))
      .limit(1);
    if (!user) throw new AppError(400, "INVALID_ASSIGNEE", "El usuario asignado no pertenece a este estudio");
  }

  const id = uuidv7();
  const [created] = await db
    .insert(events)
    .values({
      id,
      firmId,
      caseId: data.caseId ?? null,
      matterId: data.matterId ?? null,
      eventType: data.eventType,
      title: data.title,
      description: data.description ?? null,
      eventDate: data.eventDate,
      eventTime: data.isAllDay ? null : (data.eventTime ?? null),
      endDate: data.endDate ?? null,
      endTime: data.isAllDay ? null : (data.endTime ?? null),
      isAllDay: data.isAllDay,
      assignedToId: data.assignedToId ?? null,
      status: data.status,
      reminderMinutesBefore: data.reminderMinutesBefore ?? 60,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return created!;
}

export async function findAll(firmId: string, filters: FindAllFilters) {
  const conditions = [eq(events.firmId, firmId)];

  if (filters.caseId) conditions.push(eq(events.caseId, filters.caseId));
  if (filters.matterId) conditions.push(eq(events.matterId, filters.matterId));
  if (filters.eventType) conditions.push(eq(events.eventType, filters.eventType));
  if (filters.status) conditions.push(eq(events.status, filters.status));

  const where = and(...conditions);
  const sortCol = sortColumns[filters.sort as keyof typeof sortColumns] ?? events.eventDate;
  const orderFn = filters.order === "desc" ? desc : asc;
  const offset = (filters.page - 1) * filters.limit;

  const assignee = users;

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: events.id,
        firmId: events.firmId,
        caseId: events.caseId,
        matterId: events.matterId,
        eventType: events.eventType,
        title: events.title,
        description: events.description,
        eventDate: events.eventDate,
        eventTime: events.eventTime,
        endDate: events.endDate,
        endTime: events.endTime,
        isAllDay: events.isAllDay,
        assignedToId: events.assignedToId,
        status: events.status,
        reminderMinutesBefore: events.reminderMinutesBefore,
        createdBy: events.createdBy,
        createdAt: events.createdAt,
        updatedBy: events.updatedBy,
        updatedAt: events.updatedAt,
        assigneeFirstName: assignee.firstName,
        assigneeLastName: assignee.lastName,
      })
      .from(events)
      .leftJoin(assignee, eq(events.assignedToId, assignee.id))
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(filters.limit)
      .offset(offset),
    db.select({ count: count() }).from(events).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  const formatted = data.map((row) => ({
    id: row.id,
    firmId: row.firmId,
    caseId: row.caseId,
    matterId: row.matterId,
    eventType: row.eventType,
    title: row.title,
    description: row.description,
    eventDate: row.eventDate,
    eventTime: row.eventTime,
    endDate: row.endDate,
    endTime: row.endTime,
    isAllDay: row.isAllDay,
    assignedToId: row.assignedToId,
    status: row.status,
    reminderMinutesBefore: row.reminderMinutesBefore,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt,
    assigneeName: row.assigneeFirstName && row.assigneeLastName
      ? `${row.assigneeLastName}, ${row.assigneeFirstName}`
      : null,
  }));

  return {
    data: formatted,
    meta: { total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) },
  };
}

export async function findById(firmId: string, id: string) {
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.firmId, firmId)))
    .limit(1);

  if (!event) throw new AppError(404, "EVENT_NOT_FOUND", "Evento no encontrado");
  return event;
}

export async function update(firmId: string, id: string, data: Partial<CreateEventData>, userId: string) {
  const [existing] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, id), eq(events.firmId, firmId)))
    .limit(1);
  if (!existing) throw new AppError(404, "EVENT_NOT_FOUND", "Evento no encontrado");

  if (data.assignedToId) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, data.assignedToId), eq(users.firmId, firmId)))
      .limit(1);
    if (!user) throw new AppError(400, "INVALID_ASSIGNEE", "El usuario asignado no pertenece a este estudio");
  }

  const [updated] = await db
    .update(events)
    .set({
      ...data,
      eventDate: data.eventDate !== undefined ? data.eventDate : undefined,
      endDate: data.endDate !== undefined ? (data.endDate ?? null) : undefined,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(events.id, id), eq(events.firmId, firmId)))
    .returning();

  return updated!;
}

export async function remove(firmId: string, id: string) {
  const [existing] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, id), eq(events.firmId, firmId)))
    .limit(1);

  if (!existing) throw new AppError(404, "EVENT_NOT_FOUND", "Evento no encontrado");

  await db.delete(events).where(and(eq(events.id, id), eq(events.firmId, firmId)));
}
