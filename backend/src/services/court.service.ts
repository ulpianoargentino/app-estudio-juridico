import { eq, and, or, ilike, asc, desc, count } from "drizzle-orm";
import { db } from "../db";
import { courts } from "../models";
import { uuidv7 } from "../utils/uuid";
import { AppError } from "../middleware/error-handler";

interface CreateCourtData {
  name: string;
  courtType: string;
  jurisdiction: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}

interface FindAllFilters {
  page: number;
  limit: number;
  search?: string;
  sort: string;
  order: string;
}

const sortColumns = {
  name: courts.name,
  jurisdiction: courts.jurisdiction,
  created_at: courts.createdAt,
} as const;

export async function create(firmId: string, data: CreateCourtData, userId: string) {
  const id = uuidv7();
  const [court] = await db
    .insert(courts)
    .values({
      id,
      firmId,
      name: data.name,
      courtType: data.courtType,
      jurisdiction: data.jurisdiction,
      address: data.address ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      notes: data.notes ?? null,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();
  return court!;
}

export async function findAll(firmId: string, filters: FindAllFilters) {
  const conditions = [eq(courts.firmId, firmId), eq(courts.isActive, true)];

  if (filters.search) {
    const pattern = `%${filters.search}%`;
    conditions.push(
      or(ilike(courts.name, pattern), ilike(courts.jurisdiction, pattern))!
    );
  }

  const where = and(...conditions);
  const sortCol = sortColumns[filters.sort as keyof typeof sortColumns] ?? courts.name;
  const orderFn = filters.order === "desc" ? desc : asc;
  const offset = (filters.page - 1) * filters.limit;

  const [data, totalResult] = await Promise.all([
    db.select().from(courts).where(where).orderBy(orderFn(sortCol)).limit(filters.limit).offset(offset),
    db.select({ count: count() }).from(courts).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;
  return {
    data,
    meta: { total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) },
  };
}

export async function findById(firmId: string, id: string) {
  const [court] = await db
    .select()
    .from(courts)
    .where(and(eq(courts.id, id), eq(courts.firmId, firmId)))
    .limit(1);
  if (!court) throw new AppError(404, "COURT_NOT_FOUND", "Juzgado no encontrado");
  return court;
}

export async function update(firmId: string, id: string, data: Partial<CreateCourtData>, userId: string) {
  const [existing] = await db
    .select({ id: courts.id })
    .from(courts)
    .where(and(eq(courts.id, id), eq(courts.firmId, firmId)))
    .limit(1);
  if (!existing) throw new AppError(404, "COURT_NOT_FOUND", "Juzgado no encontrado");

  const [updated] = await db
    .update(courts)
    .set({ ...data, updatedBy: userId, updatedAt: new Date() })
    .where(and(eq(courts.id, id), eq(courts.firmId, firmId)))
    .returning();
  return updated!;
}

export async function softDelete(firmId: string, id: string, userId: string) {
  const [existing] = await db
    .select({ id: courts.id })
    .from(courts)
    .where(and(eq(courts.id, id), eq(courts.firmId, firmId)))
    .limit(1);
  if (!existing) throw new AppError(404, "COURT_NOT_FOUND", "Juzgado no encontrado");

  await db
    .update(courts)
    .set({ isActive: false, updatedBy: userId, updatedAt: new Date() })
    .where(and(eq(courts.id, id), eq(courts.firmId, firmId)));
}
