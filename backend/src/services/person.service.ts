import { eq, and, or, ilike, sql, asc, desc, count } from "drizzle-orm";
import { db } from "../db";
import { persons, parties, cases, matters } from "../models";
import { uuidv7 } from "../utils/uuid";
import { AppError } from "../middleware/error-handler";
import type { PersonCreateInput, PersonUpdateInput, PersonQuery } from "@shared";

type CreatePersonData = PersonCreateInput;
type UpdatePersonData = PersonUpdateInput;
type FindAllFilters = PersonQuery;

const sortColumns = {
  last_name: persons.lastName,
  first_name: persons.firstName,
  created_at: persons.createdAt,
} as const;

// Los inputs opcionales llegan como "" cuando el usuario deja el campo vacío
// (el schema Zod acepta "" para evitar que react-hook-form falle antes del submit).
// En DB preferimos NULL por consistencia, así que normalizamos acá.
function toNullable(v: string | null | undefined): string | null {
  return v === "" || v === null || v === undefined ? null : v;
}

export async function create(
  firmId: string,
  data: CreatePersonData,
  userId: string
) {
  const id = uuidv7();

  const [person] = await db
    .insert(persons)
    .values({
      id,
      firmId,
      personType: data.personType,
      firstName: data.firstName,
      lastName: data.lastName,
      businessName: toNullable(data.businessName),
      cuitCuil: toNullable(data.cuitCuil),
      email: toNullable(data.email),
      phone: toNullable(data.phone),
      mobilePhone: toNullable(data.mobilePhone),
      addressStreet: toNullable(data.addressStreet),
      addressCity: toNullable(data.addressCity),
      addressState: toNullable(data.addressState),
      addressZip: toNullable(data.addressZip),
      legalAddress: toNullable(data.legalAddress),
      appointedAddress: toNullable(data.appointedAddress),
      notes: toNullable(data.notes),
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return person!;
}

export async function findAll(firmId: string, filters: FindAllFilters) {
  const conditions = [eq(persons.firmId, firmId)];

  if (filters.isActive !== undefined) {
    conditions.push(eq(persons.isActive, filters.isActive));
  } else {
    // Por defecto solo personas activas
    conditions.push(eq(persons.isActive, true));
  }

  if (filters.personType) {
    conditions.push(eq(persons.personType, filters.personType));
  }

  if (filters.search) {
    const pattern = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(persons.firstName, pattern),
        ilike(persons.lastName, pattern),
        ilike(persons.businessName, pattern),
        ilike(persons.cuitCuil, pattern)
      )!
    );
  }

  const where = and(...conditions);
  const sortCol = sortColumns[filters.sort as keyof typeof sortColumns] ?? persons.lastName;
  const orderFn = filters.order === "desc" ? desc : asc;
  const offset = (filters.page - 1) * filters.limit;

  const [data, totalResult] = await Promise.all([
    db
      .select()
      .from(persons)
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(filters.limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(persons)
      .where(where),
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

export async function findById(firmId: string, id: string) {
  const [person] = await db
    .select()
    .from(persons)
    .where(and(eq(persons.id, id), eq(persons.firmId, firmId)))
    .limit(1);

  if (!person) {
    throw new AppError(404, "PERSON_NOT_FOUND", "Persona no encontrada");
  }

  // Obtener vinculaciones a cases y matters con roles
  const partyLinks = await db
    .select({
      id: parties.id,
      role: parties.role,
      caseId: parties.caseId,
      matterId: parties.matterId,
      caseTitle: cases.caseTitle,
      caseNumber: cases.caseNumber,
      matterTitle: matters.title,
    })
    .from(parties)
    .leftJoin(cases, eq(parties.caseId, cases.id))
    .leftJoin(matters, eq(parties.matterId, matters.id))
    .where(
      and(eq(parties.personId, id), eq(parties.firmId, firmId))
    );

  return { ...person, parties: partyLinks };
}

export async function update(
  firmId: string,
  id: string,
  data: UpdatePersonData,
  userId: string
) {
  // Verificar que exista y pertenezca al firm
  const [existing] = await db
    .select({ id: persons.id })
    .from(persons)
    .where(and(eq(persons.id, id), eq(persons.firmId, firmId)))
    .limit(1);

  if (!existing) {
    throw new AppError(404, "PERSON_NOT_FOUND", "Persona no encontrada");
  }

  // Normalizamos "" → null para campos opcionales antes de persistir.
  // firstName/lastName no se afectan: son NOT NULL y el schema Zod rechaza "" con .min(1).
  const normalized: Record<string, unknown> = { ...data };
  for (const key of Object.keys(normalized)) {
    if (normalized[key] === "") normalized[key] = null;
  }

  const [updated] = await db
    .update(persons)
    .set({
      ...normalized,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(persons.id, id), eq(persons.firmId, firmId)))
    .returning();

  return updated!;
}

export async function softDelete(firmId: string, id: string, userId: string) {
  // El borrado es lógico: isActive=false. Las vinculaciones en `parties` quedan
  // intactas para preservar la trazabilidad histórica de expedientes y casos.
  const [existing] = await db
    .select({ id: persons.id })
    .from(persons)
    .where(and(eq(persons.id, id), eq(persons.firmId, firmId)))
    .limit(1);

  if (!existing) {
    throw new AppError(404, "PERSON_NOT_FOUND", "Persona no encontrada");
  }

  await db
    .update(persons)
    .set({ isActive: false, updatedBy: userId, updatedAt: new Date() })
    .where(and(eq(persons.id, id), eq(persons.firmId, firmId)));
}

export async function search(firmId: string, query: string) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const pattern = `%${query}%`;

  const results = await db
    .select({
      id: persons.id,
      firstName: persons.firstName,
      lastName: persons.lastName,
      businessName: persons.businessName,
      cuitCuil: persons.cuitCuil,
      personType: persons.personType,
    })
    .from(persons)
    .where(
      and(
        eq(persons.firmId, firmId),
        eq(persons.isActive, true),
        or(
          ilike(persons.firstName, pattern),
          ilike(persons.lastName, pattern),
          ilike(persons.businessName, pattern),
          ilike(persons.cuitCuil, pattern),
          ilike(sql`${persons.firstName} || ' ' || ${persons.lastName}`, pattern)
        )
      )
    )
    .orderBy(asc(persons.lastName), asc(persons.firstName))
    .limit(10);

  return results;
}
