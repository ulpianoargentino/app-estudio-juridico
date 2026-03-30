import { eq, and, asc, desc, count, gte, lte } from "drizzle-orm";
import { db } from "../db";
import { movements, cases, matters } from "../models";
import { uuidv7 } from "../utils/uuid";
import { AppError } from "../middleware/error-handler";

interface CreateMovementData {
  movementDate: Date;
  movementType: string;
  description: string;
  volume?: string | null;
  folio?: number | null;
  documentUrl?: string | null;
}

interface FindMovementFilters {
  page: number;
  limit: number;
  movementType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sort: string;
  order: string;
}

const sortColumns = {
  movement_date: movements.movementDate,
  created_at: movements.createdAt,
} as const;

export async function create(
  firmId: string,
  data: CreateMovementData & { caseId?: string; matterId?: string },
  userId: string,
) {
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

    // Matters don't support volume/folio
    data.volume = null;
    data.folio = null;
  }

  const id = uuidv7();
  const [created] = await db
    .insert(movements)
    .values({
      id,
      firmId,
      caseId: data.caseId ?? null,
      matterId: data.matterId ?? null,
      movementDate: data.movementDate,
      movementType: data.movementType,
      description: data.description,
      volume: data.volume ?? null,
      folio: data.folio ?? null,
      documentUrl: data.documentUrl ?? null,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  // Update parent's updated_at
  if (data.caseId) {
    await db
      .update(cases)
      .set({ updatedAt: new Date(), updatedBy: userId })
      .where(and(eq(cases.id, data.caseId), eq(cases.firmId, firmId)));
  }
  if (data.matterId) {
    await db
      .update(matters)
      .set({ updatedAt: new Date(), updatedBy: userId })
      .where(and(eq(matters.id, data.matterId), eq(matters.firmId, firmId)));
  }

  return created!;
}

function buildFilters(firmId: string, filters: FindMovementFilters) {
  const conditions = [eq(movements.firmId, firmId)];
  if (filters.movementType) conditions.push(eq(movements.movementType, filters.movementType));
  if (filters.dateFrom) conditions.push(gte(movements.movementDate, filters.dateFrom));
  if (filters.dateTo) conditions.push(lte(movements.movementDate, filters.dateTo));
  return conditions;
}

export async function findByCase(firmId: string, caseId: string, filters: FindMovementFilters) {
  const conditions = buildFilters(firmId, filters);
  conditions.push(eq(movements.caseId, caseId));
  return query(conditions, filters);
}

export async function findByMatter(firmId: string, matterId: string, filters: FindMovementFilters) {
  const conditions = buildFilters(firmId, filters);
  conditions.push(eq(movements.matterId, matterId));
  return query(conditions, filters);
}

async function query(conditions: ReturnType<typeof buildFilters>, filters: FindMovementFilters) {
  const where = and(...conditions);
  const sortCol = sortColumns[filters.sort as keyof typeof sortColumns] ?? movements.movementDate;
  const orderFn = filters.order === "desc" ? desc : asc;
  const offset = (filters.page - 1) * filters.limit;

  const [data, totalResult] = await Promise.all([
    db
      .select()
      .from(movements)
      .where(where)
      .orderBy(orderFn(sortCol), desc(movements.volume), asc(movements.folio))
      .limit(filters.limit)
      .offset(offset),
    db.select({ count: count() }).from(movements).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;
  return {
    data,
    meta: { total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) },
  };
}

export async function update(firmId: string, id: string, data: Partial<CreateMovementData>, userId: string) {
  const [existing] = await db
    .select()
    .from(movements)
    .where(and(eq(movements.id, id), eq(movements.firmId, firmId)))
    .limit(1);
  if (!existing) throw new AppError(404, "MOVEMENT_NOT_FOUND", "Movimiento no encontrado");

  // If linked to a matter, strip volume/folio
  if (existing.matterId) {
    data.volume = null;
    data.folio = null;
  }

  const [updated] = await db
    .update(movements)
    .set({
      ...data,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(movements.id, id), eq(movements.firmId, firmId)))
    .returning();

  return updated!;
}

export async function remove(firmId: string, id: string, _userId: string) {
  const [existing] = await db
    .select({ id: movements.id })
    .from(movements)
    .where(and(eq(movements.id, id), eq(movements.firmId, firmId)))
    .limit(1);
  if (!existing) throw new AppError(404, "MOVEMENT_NOT_FOUND", "Movimiento no encontrado");

  await db.delete(movements).where(and(eq(movements.id, id), eq(movements.firmId, firmId)));
}
