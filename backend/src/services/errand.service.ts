import { eq, and, asc, desc, count } from "drizzle-orm";
import { db } from "../db";
import { errands, cases, events, users } from "../models";
import { errandStatus } from "../models/enums";
import { uuidv7 } from "../utils/uuid";
import { AppError } from "../middleware/error-handler";

interface CreateErrandData {
  errandType: string;
  status: string;
  responsibleId?: string | null;
  dueDate?: Date | null;
  notes?: string | null;
  createEvent: boolean;
}

interface UpdateErrandData {
  errandType?: string;
  status?: string;
  responsibleId?: string | null;
  dueDate?: Date | null;
  notes?: string | null;
}

interface FindErrandFilters {
  page: number;
  limit: number;
  errandType?: string;
  status?: string;
  sort: string;
  order: string;
}

const sortColumns = {
  due_date: errands.dueDate,
  created_at: errands.createdAt,
} as const;

export async function create(firmId: string, caseId: string, data: CreateErrandData, userId: string) {
  // Validate case exists
  const [c] = await db
    .select({ id: cases.id })
    .from(cases)
    .where(and(eq(cases.id, caseId), eq(cases.firmId, firmId)))
    .limit(1);
  if (!c) throw new AppError(404, "CASE_NOT_FOUND", "Expediente no encontrado");

  // Validate responsible user if provided
  if (data.responsibleId) {
    const [u] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, data.responsibleId), eq(users.firmId, firmId)))
      .limit(1);
    if (!u) throw new AppError(400, "INVALID_RESPONSIBLE", "El responsable no pertenece a este estudio");
  }

  const id = uuidv7();
  const [created] = await db
    .insert(errands)
    .values({
      id,
      firmId,
      caseId,
      errandType: data.errandType,
      status: data.status,
      responsibleId: data.responsibleId ?? null,
      dueDate: data.dueDate ?? null,
      notes: data.notes ?? null,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  // Auto-create calendar event if requested and dueDate is set
  if (data.createEvent && data.dueDate) {
    await db.insert(events).values({
      id: uuidv7(),
      firmId,
      caseId,
      eventType: "DEADLINE",
      title: `Gestión: ${data.errandType}`,
      description: data.notes ?? null,
      eventDate: data.dueDate,
      isAllDay: true,
      assignedToId: data.responsibleId ?? null,
      status: "PENDING",
      createdBy: userId,
      updatedBy: userId,
    });
  }

  return created!;
}

export async function findByCase(firmId: string, caseId: string, filters: FindErrandFilters) {
  const conditions = [eq(errands.firmId, firmId), eq(errands.caseId, caseId)];
  if (filters.errandType) conditions.push(eq(errands.errandType, filters.errandType));
  if (filters.status) conditions.push(eq(errands.status, filters.status));

  const where = and(...conditions);
  const sortCol = sortColumns[filters.sort as keyof typeof sortColumns] ?? errands.dueDate;
  const orderFn = filters.order === "desc" ? desc : asc;
  const offset = (filters.page - 1) * filters.limit;

  const [data, totalResult] = await Promise.all([
    db.select().from(errands).where(where).orderBy(orderFn(sortCol)).limit(filters.limit).offset(offset),
    db.select({ count: count() }).from(errands).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;
  return {
    data,
    meta: { total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) },
  };
}

export async function update(firmId: string, id: string, data: UpdateErrandData, userId: string) {
  const [existing] = await db
    .select()
    .from(errands)
    .where(and(eq(errands.id, id), eq(errands.firmId, firmId)))
    .limit(1);
  if (!existing) throw new AppError(404, "ERRAND_NOT_FOUND", "Gestión no encontrada");

  if (data.responsibleId) {
    const [u] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, data.responsibleId), eq(users.firmId, firmId)))
      .limit(1);
    if (!u) throw new AppError(400, "INVALID_RESPONSIBLE", "El responsable no pertenece a este estudio");
  }

  // Auto-set completedDate when status changes to COMPLETED
  const completedDate =
    data.status === errandStatus.COMPLETED && existing.status !== errandStatus.COMPLETED
      ? new Date()
      : data.status && data.status !== errandStatus.COMPLETED
        ? null
        : undefined;

  const [updated] = await db
    .update(errands)
    .set({
      ...data,
      ...(completedDate !== undefined ? { completedDate } : {}),
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(errands.id, id), eq(errands.firmId, firmId)))
    .returning();

  return updated!;
}

export async function remove(firmId: string, id: string, _userId: string) {
  const [existing] = await db
    .select({ id: errands.id })
    .from(errands)
    .where(and(eq(errands.id, id), eq(errands.firmId, firmId)))
    .limit(1);
  if (!existing) throw new AppError(404, "ERRAND_NOT_FOUND", "Gestión no encontrada");

  await db.delete(errands).where(and(eq(errands.id, id), eq(errands.firmId, firmId)));
}
