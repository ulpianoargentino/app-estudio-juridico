import { eq, and, asc, desc, count, gte, lte } from "drizzle-orm";
import { db } from "../db";
import { events, cases, matters, users } from "../models";
import { eventStatus } from "../models/enums";
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
  reminderMinutesBefore: number;
}

interface FindEventFilters {
  page: number;
  limit: number;
  startDate?: Date;
  endDate?: Date;
  eventType?: string;
  assignedToId?: string;
  status?: string;
  caseId?: string;
  matterId?: string;
  sort: string;
  order: string;
}

const sortColumns = {
  event_date: events.eventDate,
  created_at: events.createdAt,
} as const;

async function validateRelations(firmId: string, data: Partial<CreateEventData>) {
  if (data.caseId) {
    const [c] = await db
      .select({ id: cases.id })
      .from(cases)
      .where(and(eq(cases.id, data.caseId), eq(cases.firmId, firmId)))
      .limit(1);
    if (!c) throw new AppError(404, "CASE_NOT_FOUND", "Expediente no encontrado");
  }
  if (data.matterId) {
    const [m] = await db
      .select({ id: matters.id })
      .from(matters)
      .where(and(eq(matters.id, data.matterId), eq(matters.firmId, firmId)))
      .limit(1);
    if (!m) throw new AppError(404, "MATTER_NOT_FOUND", "Caso no encontrado");
  }
  if (data.assignedToId) {
    const [u] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, data.assignedToId), eq(users.firmId, firmId)))
      .limit(1);
    if (!u) throw new AppError(400, "INVALID_ASSIGNED_USER", "El usuario asignado no pertenece a este estudio");
  }
}

export async function create(firmId: string, data: CreateEventData, userId: string) {
  await validateRelations(firmId, data);

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
      eventTime: data.eventTime ?? null,
      endDate: data.endDate ?? null,
      endTime: data.endTime ?? null,
      isAllDay: data.isAllDay,
      assignedToId: data.assignedToId ?? null,
      status: data.status,
      reminderMinutesBefore: data.reminderMinutesBefore,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return created!;
}

export async function findAll(firmId: string, filters: FindEventFilters) {
  const conditions = [eq(events.firmId, firmId)];
  if (filters.startDate) conditions.push(gte(events.eventDate, filters.startDate));
  if (filters.endDate) conditions.push(lte(events.eventDate, filters.endDate));
  if (filters.eventType) conditions.push(eq(events.eventType, filters.eventType));
  if (filters.assignedToId) conditions.push(eq(events.assignedToId, filters.assignedToId));
  if (filters.status) conditions.push(eq(events.status, filters.status));
  if (filters.caseId) conditions.push(eq(events.caseId, filters.caseId));
  if (filters.matterId) conditions.push(eq(events.matterId, filters.matterId));

  const where = and(...conditions);
  const sortCol = sortColumns[filters.sort as keyof typeof sortColumns] ?? events.eventDate;
  const orderFn = filters.order === "desc" ? desc : asc;
  const offset = (filters.page - 1) * filters.limit;

  const [data, totalResult] = await Promise.all([
    db.select().from(events).where(where).orderBy(orderFn(sortCol)).limit(filters.limit).offset(offset),
    db.select({ count: count() }).from(events).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;
  return {
    data,
    meta: { total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) },
  };
}

export async function findUpcoming(firmId: string, userId: string, days: number) {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);

  const data = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.firmId, firmId),
        eq(events.assignedToId, userId),
        eq(events.status, eventStatus.PENDING),
        gte(events.eventDate, now),
        lte(events.eventDate, future),
      ),
    )
    .orderBy(asc(events.eventDate));

  return data;
}

export async function findByCase(firmId: string, caseId: string, filters: FindEventFilters) {
  filters.caseId = caseId;
  return findAll(firmId, filters);
}

export async function findByMatter(firmId: string, matterId: string, filters: FindEventFilters) {
  filters.matterId = matterId;
  return findAll(firmId, filters);
}

export async function update(firmId: string, id: string, data: Partial<CreateEventData>, userId: string) {
  const [existing] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, id), eq(events.firmId, firmId)))
    .limit(1);
  if (!existing) throw new AppError(404, "EVENT_NOT_FOUND", "Evento no encontrado");

  await validateRelations(firmId, data);

  const [updated] = await db
    .update(events)
    .set({
      ...data,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(events.id, id), eq(events.firmId, firmId)))
    .returning();

  return updated!;
}

export async function complete(firmId: string, id: string, userId: string) {
  const [existing] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, id), eq(events.firmId, firmId)))
    .limit(1);
  if (!existing) throw new AppError(404, "EVENT_NOT_FOUND", "Evento no encontrado");

  const [updated] = await db
    .update(events)
    .set({
      status: eventStatus.COMPLETED,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(events.id, id), eq(events.firmId, firmId)))
    .returning();

  return updated!;
}

export async function remove(firmId: string, id: string, _userId: string) {
  const [existing] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, id), eq(events.firmId, firmId)))
    .limit(1);
  if (!existing) throw new AppError(404, "EVENT_NOT_FOUND", "Evento no encontrado");

  await db.delete(events).where(and(eq(events.id, id), eq(events.firmId, firmId)));
}
