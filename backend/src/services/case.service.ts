import { eq, and, or, ilike, asc, desc, count, gte, sql } from "drizzle-orm";
import { db } from "../db";
import { cases, persons, users, courts, parties, movements, documents, events } from "../models";
import { uuidv7 } from "../utils/uuid";
import { AppError } from "../middleware/error-handler";

interface CreateCaseData {
  caseNumber?: string | null;
  caseTitle: string;
  jurisdictionType: string;
  jurisdiction?: string | null;
  courtId?: string | null;
  processType?: string | null;
  status: string;
  primaryClientId?: string | null;
  responsibleAttorneyId?: string | null;
  startDate?: Date | null;
  claimedAmount?: string | null;
  currency?: string | null;
  portalUrl?: string | null;
  notes?: string | null;
}

interface FindAllFilters {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  jurisdictionType?: string;
  responsibleAttorneyId?: string;
  primaryClientId?: string;
  isActive?: boolean;
  sort: string;
  order: string;
}

const sortColumns = {
  updated_at: cases.updatedAt,
  created_at: cases.createdAt,
  case_title: cases.caseTitle,
  case_number: cases.caseNumber,
} as const;

async function validateRelations(firmId: string, data: CreateCaseData) {
  if (data.primaryClientId) {
    const [person] = await db
      .select({ id: persons.id })
      .from(persons)
      .where(and(eq(persons.id, data.primaryClientId), eq(persons.firmId, firmId)))
      .limit(1);
    if (!person) throw new AppError(400, "INVALID_CLIENT", "El cliente principal no pertenece a este estudio");
  }

  if (data.responsibleAttorneyId) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, data.responsibleAttorneyId), eq(users.firmId, firmId)))
      .limit(1);
    if (!user) throw new AppError(400, "INVALID_ATTORNEY", "El abogado responsable no pertenece a este estudio");
  }

  if (data.courtId) {
    const [court] = await db
      .select({ id: courts.id })
      .from(courts)
      .where(and(eq(courts.id, data.courtId), eq(courts.firmId, firmId)))
      .limit(1);
    if (!court) throw new AppError(400, "INVALID_COURT", "El juzgado no pertenece a este estudio");
  }
}

export async function create(firmId: string, data: CreateCaseData, userId: string) {
  await validateRelations(firmId, data);

  const id = uuidv7();
  const [created] = await db
    .insert(cases)
    .values({
      id,
      firmId,
      caseNumber: data.caseNumber ?? null,
      caseTitle: data.caseTitle,
      jurisdictionType: data.jurisdictionType,
      jurisdiction: data.jurisdiction ?? null,
      courtId: data.courtId ?? null,
      processType: data.processType ?? null,
      status: data.status,
      primaryClientId: data.primaryClientId ?? null,
      responsibleAttorneyId: data.responsibleAttorneyId ?? null,
      startDate: data.startDate ?? null,
      claimedAmount: data.claimedAmount ?? null,
      currency: data.currency ?? "ARS",
      portalUrl: data.portalUrl ?? null,
      notes: data.notes ?? null,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return created!;
}

export async function findAll(firmId: string, filters: FindAllFilters) {
  // Aliases para los joins
  const clientPerson = persons;
  const attorneyUser = users;

  const conditions = [eq(cases.firmId, firmId)];

  if (filters.isActive !== undefined) {
    conditions.push(eq(cases.isActive, filters.isActive));
  } else {
    conditions.push(eq(cases.isActive, true));
  }

  if (filters.status) conditions.push(eq(cases.status, filters.status));
  if (filters.jurisdictionType) conditions.push(eq(cases.jurisdictionType, filters.jurisdictionType));
  if (filters.responsibleAttorneyId) conditions.push(eq(cases.responsibleAttorneyId, filters.responsibleAttorneyId));
  if (filters.primaryClientId) conditions.push(eq(cases.primaryClientId, filters.primaryClientId));

  if (filters.search) {
    const pattern = `%${filters.search}%`;
    conditions.push(
      or(ilike(cases.caseNumber, pattern), ilike(cases.caseTitle, pattern))!
    );
  }

  const where = and(...conditions);
  const sortCol = sortColumns[filters.sort as keyof typeof sortColumns] ?? cases.updatedAt;
  const orderFn = filters.order === "desc" ? desc : asc;
  const offset = (filters.page - 1) * filters.limit;

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: cases.id,
        firmId: cases.firmId,
        caseNumber: cases.caseNumber,
        caseTitle: cases.caseTitle,
        jurisdictionType: cases.jurisdictionType,
        jurisdiction: cases.jurisdiction,
        courtId: cases.courtId,
        processType: cases.processType,
        status: cases.status,
        primaryClientId: cases.primaryClientId,
        responsibleAttorneyId: cases.responsibleAttorneyId,
        startDate: cases.startDate,
        claimedAmount: cases.claimedAmount,
        currency: cases.currency,
        portalUrl: cases.portalUrl,
        notes: cases.notes,
        isActive: cases.isActive,
        createdBy: cases.createdBy,
        createdAt: cases.createdAt,
        updatedBy: cases.updatedBy,
        updatedAt: cases.updatedAt,
        // Joined names
        clientFirstName: clientPerson.firstName,
        clientLastName: clientPerson.lastName,
        clientBusinessName: clientPerson.businessName,
        attorneyFirstName: attorneyUser.firstName,
        attorneyLastName: attorneyUser.lastName,
      })
      .from(cases)
      .leftJoin(clientPerson, eq(cases.primaryClientId, clientPerson.id))
      .leftJoin(attorneyUser, eq(cases.responsibleAttorneyId, attorneyUser.id))
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(filters.limit)
      .offset(offset),
    db.select({ count: count() }).from(cases).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  // Format response to include client/attorney names
  const formatted = data.map((row) => ({
    id: row.id,
    firmId: row.firmId,
    caseNumber: row.caseNumber,
    caseTitle: row.caseTitle,
    jurisdictionType: row.jurisdictionType,
    jurisdiction: row.jurisdiction,
    courtId: row.courtId,
    processType: row.processType,
    status: row.status,
    primaryClientId: row.primaryClientId,
    responsibleAttorneyId: row.responsibleAttorneyId,
    startDate: row.startDate,
    claimedAmount: row.claimedAmount,
    currency: row.currency,
    portalUrl: row.portalUrl,
    notes: row.notes,
    isActive: row.isActive,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt,
    primaryClientName: row.clientBusinessName || (row.clientFirstName && row.clientLastName
      ? `${row.clientLastName}, ${row.clientFirstName}`
      : null),
    responsibleAttorneyName: row.attorneyFirstName && row.attorneyLastName
      ? `${row.attorneyLastName}, ${row.attorneyFirstName}`
      : null,
  }));

  return {
    data: formatted,
    meta: { total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) },
  };
}

export async function findById(firmId: string, id: string) {
  const [caseRow] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, id), eq(cases.firmId, firmId)))
    .limit(1);

  if (!caseRow) throw new AppError(404, "CASE_NOT_FOUND", "Expediente no encontrado");

  // Parallel fetches for related data
  const [
    courtData,
    clientData,
    attorneyData,
    partyLinks,
    movementCount,
    documentCount,
    upcomingEventCount,
  ] = await Promise.all([
    caseRow.courtId
      ? db.select().from(courts).where(and(eq(courts.id, caseRow.courtId), eq(courts.firmId, firmId))).limit(1)
      : Promise.resolve([]),
    caseRow.primaryClientId
      ? db.select({ id: persons.id, firstName: persons.firstName, lastName: persons.lastName, businessName: persons.businessName, personType: persons.personType })
          .from(persons).where(eq(persons.id, caseRow.primaryClientId)).limit(1)
      : Promise.resolve([]),
    caseRow.responsibleAttorneyId
      ? db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
          .from(users).where(eq(users.id, caseRow.responsibleAttorneyId)).limit(1)
      : Promise.resolve([]),
    db
      .select({
        id: parties.id,
        role: parties.role,
        notes: parties.notes,
        personId: parties.personId,
        firstName: persons.firstName,
        lastName: persons.lastName,
        businessName: persons.businessName,
        personType: persons.personType,
      })
      .from(parties)
      .leftJoin(persons, eq(parties.personId, persons.id))
      .where(and(eq(parties.caseId, id), eq(parties.firmId, firmId))),
    db.select({ count: count() }).from(movements).where(and(eq(movements.caseId, id), eq(movements.firmId, firmId))),
    db.select({ count: count() }).from(documents).where(and(eq(documents.caseId, id), eq(documents.firmId, firmId))),
    db.select({ count: count() }).from(events).where(
      and(eq(events.caseId, id), eq(events.firmId, firmId), gte(events.eventDate, new Date()))
    ),
  ]);

  return {
    ...caseRow,
    court: courtData[0] ?? null,
    primaryClient: clientData[0] ?? null,
    responsibleAttorney: attorneyData[0] ?? null,
    parties: partyLinks,
    movementCount: movementCount[0]?.count ?? 0,
    documentCount: documentCount[0]?.count ?? 0,
    upcomingEventCount: upcomingEventCount[0]?.count ?? 0,
  };
}

export async function update(firmId: string, id: string, data: Partial<CreateCaseData>, userId: string) {
  const [existing] = await db
    .select({ id: cases.id })
    .from(cases)
    .where(and(eq(cases.id, id), eq(cases.firmId, firmId)))
    .limit(1);
  if (!existing) throw new AppError(404, "CASE_NOT_FOUND", "Expediente no encontrado");

  await validateRelations(firmId, data as CreateCaseData);

  const [updated] = await db
    .update(cases)
    .set({
      ...data,
      startDate: data.startDate !== undefined ? (data.startDate ?? null) : undefined,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(eq(cases.id, id), eq(cases.firmId, firmId)))
    .returning();

  return updated!;
}

export async function softDelete(firmId: string, id: string, userId: string) {
  const [existing] = await db
    .select({ id: cases.id })
    .from(cases)
    .where(and(eq(cases.id, id), eq(cases.firmId, firmId)))
    .limit(1);
  if (!existing) throw new AppError(404, "CASE_NOT_FOUND", "Expediente no encontrado");

  await db
    .update(cases)
    .set({ isActive: false, updatedBy: userId, updatedAt: new Date() })
    .where(and(eq(cases.id, id), eq(cases.firmId, firmId)));
}

export async function getCaseSummary(firmId: string) {
  const result = await db
    .select({
      status: cases.status,
      count: count(),
    })
    .from(cases)
    .where(and(eq(cases.firmId, firmId), eq(cases.isActive, true)))
    .groupBy(cases.status);

  const summary: Record<string, number> = {};
  for (const row of result) {
    summary[row.status] = row.count;
  }
  return summary;
}
