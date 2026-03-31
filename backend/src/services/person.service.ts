import { eq, and, or, ilike, sql, asc, desc, count } from "drizzle-orm";
import { db } from "../db";
import { persons, parties, cases, matters } from "../models";
import { uuidv7 } from "../utils/uuid";
import { NotFoundError, ConflictError } from "../utils/errors";

interface CreatePersonData {
  personType: string;
  firstName: string;
  lastName: string;
  businessName?: string | null;
  cuitCuil?: string | null;
  email?: string | null;
  phone?: string | null;
  mobilePhone?: string | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZip?: string | null;
  legalAddress?: string | null;
  appointedAddress?: string | null;
  notes?: string | null;
}

interface UpdatePersonData extends Partial<CreatePersonData> {}

interface FindAllFilters {
  page: number;
  limit: number;
  search?: string;
  personType?: string;
  isActive?: boolean;
  sort: string;
  order: string;
}

const sortColumns = {
  last_name: persons.lastName,
  first_name: persons.firstName,
  created_at: persons.createdAt,
} as const;

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
      businessName: data.businessName ?? null,
      cuitCuil: data.cuitCuil ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      mobilePhone: data.mobilePhone ?? null,
      addressStreet: data.addressStreet ?? null,
      addressCity: data.addressCity ?? null,
      addressState: data.addressState ?? null,
      addressZip: data.addressZip ?? null,
      legalAddress: data.legalAddress ?? null,
      appointedAddress: data.appointedAddress ?? null,
      notes: data.notes ?? null,
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
    throw new NotFoundError("PERSON_NOT_FOUND", "Persona no encontrada");
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
    throw new NotFoundError("PERSON_NOT_FOUND", "Persona no encontrada");
  }

  const [updated] = await db
    .update(persons)
    .set({
      ...data,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(persons.id, id), eq(persons.firmId, firmId)))
    .returning();

  return updated!;
}

export async function softDelete(firmId: string, id: string, userId: string) {
  // Verificar que exista y pertenezca al firm
  const [existing] = await db
    .select({ id: persons.id })
    .from(persons)
    .where(and(eq(persons.id, id), eq(persons.firmId, firmId)))
    .limit(1);

  if (!existing) {
    throw new NotFoundError("PERSON_NOT_FOUND", "Persona no encontrada");
  }

  // Verificar que no tenga partes vinculadas activas
  const [activeParty] = await db
    .select({ id: parties.id })
    .from(parties)
    .where(
      and(eq(parties.personId, id), eq(parties.firmId, firmId))
    )
    .limit(1);

  if (activeParty) {
    throw new ConflictError(
      "PERSON_HAS_LINKS",
      "No se puede eliminar: la persona tiene vinculaciones activas a expedientes o casos"
    );
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
