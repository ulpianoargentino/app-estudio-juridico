import { eq, and, or, ilike, asc, desc, count } from "drizzle-orm";
import { db } from "../db";
import { matters, persons, users, cases, parties, movements, documents, events } from "../models";
import { matterStatus } from "../models/enums";
import { uuidv7 } from "../utils/uuid";
import { AppError } from "../middleware/error-handler";

interface CreateMatterData {
  title: string;
  matterType: string;
  status: string;
  primaryClientId?: string | null;
  opposingPartyId?: string | null;
  responsibleAttorneyId?: string | null;
  startDate?: Date | null;
  estimatedFee?: string | null;
  currency?: string | null;
  notes?: string | null;
}

interface FindAllFilters {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  matterType?: string;
  responsibleAttorneyId?: string;
  primaryClientId?: string;
  isActive?: boolean;
  sort: string;
  order: string;
}

interface ConvertToCaseData {
  caseTitle: string;
  caseNumber?: string | null;
  jurisdictionType: string;
  jurisdiction?: string | null;
  courtId?: string | null;
  processType?: string | null;
  status: string;
}

const sortColumns = {
  updated_at: matters.updatedAt,
  created_at: matters.createdAt,
  title: matters.title,
} as const;

async function validateRelations(firmId: string, data: Partial<CreateMatterData>) {
  if (data.primaryClientId) {
    const [p] = await db.select({ id: persons.id }).from(persons)
      .where(and(eq(persons.id, data.primaryClientId), eq(persons.firmId, firmId))).limit(1);
    if (!p) throw new AppError(400, "INVALID_CLIENT", "El cliente principal no pertenece a este estudio");
  }
  if (data.opposingPartyId) {
    const [p] = await db.select({ id: persons.id }).from(persons)
      .where(and(eq(persons.id, data.opposingPartyId), eq(persons.firmId, firmId))).limit(1);
    if (!p) throw new AppError(400, "INVALID_OPPOSING_PARTY", "La contraparte no pertenece a este estudio");
  }
  if (data.responsibleAttorneyId) {
    const [u] = await db.select({ id: users.id }).from(users)
      .where(and(eq(users.id, data.responsibleAttorneyId), eq(users.firmId, firmId))).limit(1);
    if (!u) throw new AppError(400, "INVALID_ATTORNEY", "El abogado responsable no pertenece a este estudio");
  }
}

export async function create(firmId: string, data: CreateMatterData, userId: string) {
  await validateRelations(firmId, data);
  const id = uuidv7();
  const [created] = await db.insert(matters).values({
    id, firmId,
    title: data.title,
    matterType: data.matterType,
    status: data.status,
    primaryClientId: data.primaryClientId ?? null,
    opposingPartyId: data.opposingPartyId ?? null,
    responsibleAttorneyId: data.responsibleAttorneyId ?? null,
    startDate: data.startDate ?? null,
    estimatedFee: data.estimatedFee ?? null,
    currency: data.currency ?? "ARS",
    notes: data.notes ?? null,
    createdBy: userId, updatedBy: userId,
  }).returning();
  return created!;
}

export async function findAll(firmId: string, filters: FindAllFilters) {
  const conditions = [eq(matters.firmId, firmId)];

  if (filters.isActive !== undefined) {
    conditions.push(eq(matters.isActive, filters.isActive));
  } else {
    conditions.push(eq(matters.isActive, true));
  }

  if (filters.status) conditions.push(eq(matters.status, filters.status));
  if (filters.matterType) conditions.push(eq(matters.matterType, filters.matterType));
  if (filters.responsibleAttorneyId) conditions.push(eq(matters.responsibleAttorneyId, filters.responsibleAttorneyId));
  if (filters.primaryClientId) conditions.push(eq(matters.primaryClientId, filters.primaryClientId));
  if (filters.search) {
    conditions.push(ilike(matters.title, `%${filters.search}%`));
  }

  const where = and(...conditions);
  const sortCol = sortColumns[filters.sort as keyof typeof sortColumns] ?? matters.updatedAt;
  const orderFn = filters.order === "desc" ? desc : asc;
  const offset = (filters.page - 1) * filters.limit;

  const [data, totalResult] = await Promise.all([
    db.select({
      id: matters.id, firmId: matters.firmId, title: matters.title,
      matterType: matters.matterType, status: matters.status,
      primaryClientId: matters.primaryClientId, opposingPartyId: matters.opposingPartyId,
      responsibleAttorneyId: matters.responsibleAttorneyId,
      startDate: matters.startDate, estimatedFee: matters.estimatedFee,
      currency: matters.currency, notes: matters.notes,
      convertedToCaseId: matters.convertedToCaseId,
      isActive: matters.isActive,
      createdBy: matters.createdBy, createdAt: matters.createdAt,
      updatedBy: matters.updatedBy, updatedAt: matters.updatedAt,
      clientFirstName: persons.firstName, clientLastName: persons.lastName,
      clientBusinessName: persons.businessName,
      attorneyFirstName: users.firstName, attorneyLastName: users.lastName,
    })
    .from(matters)
    .leftJoin(persons, eq(matters.primaryClientId, persons.id))
    .leftJoin(users, eq(matters.responsibleAttorneyId, users.id))
    .where(where)
    .orderBy(orderFn(sortCol))
    .limit(filters.limit)
    .offset(offset),
    db.select({ count: count() }).from(matters).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;
  const formatted = data.map((r) => ({
    id: r.id, firmId: r.firmId, title: r.title,
    matterType: r.matterType, status: r.status,
    primaryClientId: r.primaryClientId, opposingPartyId: r.opposingPartyId,
    responsibleAttorneyId: r.responsibleAttorneyId,
    startDate: r.startDate, estimatedFee: r.estimatedFee,
    currency: r.currency, notes: r.notes,
    convertedToCaseId: r.convertedToCaseId,
    isActive: r.isActive,
    createdBy: r.createdBy, createdAt: r.createdAt,
    updatedBy: r.updatedBy, updatedAt: r.updatedAt,
    primaryClientName: r.clientBusinessName || (r.clientFirstName && r.clientLastName
      ? `${r.clientLastName}, ${r.clientFirstName}` : null),
    responsibleAttorneyName: r.attorneyFirstName && r.attorneyLastName
      ? `${r.attorneyLastName}, ${r.attorneyFirstName}` : null,
  }));

  return { data: formatted, meta: { total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) } };
}

export async function findById(firmId: string, id: string) {
  const [matter] = await db.select().from(matters)
    .where(and(eq(matters.id, id), eq(matters.firmId, firmId))).limit(1);
  if (!matter) throw new AppError(404, "MATTER_NOT_FOUND", "Caso no encontrado");

  const [clientData, attorneyData, partyLinks, movementCount, documentCount] = await Promise.all([
    matter.primaryClientId
      ? db.select({ id: persons.id, firstName: persons.firstName, lastName: persons.lastName, businessName: persons.businessName, personType: persons.personType })
          .from(persons).where(eq(persons.id, matter.primaryClientId)).limit(1)
      : Promise.resolve([]),
    matter.responsibleAttorneyId
      ? db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
          .from(users).where(eq(users.id, matter.responsibleAttorneyId)).limit(1)
      : Promise.resolve([]),
    db.select({
      id: parties.id, role: parties.role, notes: parties.notes, personId: parties.personId,
      firstName: persons.firstName, lastName: persons.lastName, businessName: persons.businessName, personType: persons.personType,
    }).from(parties).leftJoin(persons, eq(parties.personId, persons.id))
      .where(and(eq(parties.matterId, id), eq(parties.firmId, firmId))),
    db.select({ count: count() }).from(movements).where(and(eq(movements.matterId, id), eq(movements.firmId, firmId))),
    db.select({ count: count() }).from(documents).where(and(eq(documents.matterId, id), eq(documents.firmId, firmId))),
  ]);

  return {
    ...matter,
    primaryClient: clientData[0] ?? null,
    responsibleAttorney: attorneyData[0] ?? null,
    parties: partyLinks,
    movementCount: movementCount[0]?.count ?? 0,
    documentCount: documentCount[0]?.count ?? 0,
  };
}

export async function update(firmId: string, id: string, data: Partial<CreateMatterData>, userId: string) {
  const [existing] = await db.select({ id: matters.id }).from(matters)
    .where(and(eq(matters.id, id), eq(matters.firmId, firmId))).limit(1);
  if (!existing) throw new AppError(404, "MATTER_NOT_FOUND", "Caso no encontrado");

  await validateRelations(firmId, data);

  const [updated] = await db.update(matters).set({
    ...data,
    startDate: data.startDate !== undefined ? (data.startDate ?? null) : undefined,
    updatedBy: userId, updatedAt: new Date(),
  }).where(and(eq(matters.id, id), eq(matters.firmId, firmId))).returning();
  return updated!;
}

export async function softDelete(firmId: string, id: string, userId: string) {
  const [existing] = await db.select({ id: matters.id }).from(matters)
    .where(and(eq(matters.id, id), eq(matters.firmId, firmId))).limit(1);
  if (!existing) throw new AppError(404, "MATTER_NOT_FOUND", "Caso no encontrado");

  await db.update(matters).set({ isActive: false, updatedBy: userId, updatedAt: new Date() })
    .where(and(eq(matters.id, id), eq(matters.firmId, firmId)));
}

export async function convertToCase(firmId: string, matterId: string, caseData: ConvertToCaseData, userId: string) {
  const [matter] = await db.select().from(matters)
    .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId))).limit(1);
  if (!matter) throw new AppError(404, "MATTER_NOT_FOUND", "Caso no encontrado");
  if (matter.convertedToCaseId) throw new AppError(409, "ALREADY_CONVERTED", "Este caso ya fue convertido a expediente");

  const caseId = uuidv7();

  await db.transaction(async (tx) => {
    // a. Crear el case nuevo
    await tx.insert(cases).values({
      id: caseId, firmId,
      caseNumber: caseData.caseNumber ?? null,
      caseTitle: caseData.caseTitle,
      jurisdictionType: caseData.jurisdictionType,
      jurisdiction: caseData.jurisdiction ?? null,
      courtId: caseData.courtId ?? null,
      processType: caseData.processType ?? null,
      status: caseData.status,
      primaryClientId: matter.primaryClientId,
      responsibleAttorneyId: matter.responsibleAttorneyId,
      startDate: matter.startDate,
      notes: matter.notes,
      createdBy: userId, updatedBy: userId,
    });

    // b. Copiar parties
    const matterParties = await tx.select().from(parties)
      .where(and(eq(parties.matterId, matterId), eq(parties.firmId, firmId)));
    for (const p of matterParties) {
      await tx.insert(parties).values({
        id: uuidv7(), firmId, personId: p.personId,
        caseId, matterId: null, role: p.role, notes: p.notes,
        createdBy: userId, updatedBy: userId,
      });
    }

    // c. Copiar movements
    const matterMovements = await tx.select().from(movements)
      .where(and(eq(movements.matterId, matterId), eq(movements.firmId, firmId)));
    for (const m of matterMovements) {
      await tx.insert(movements).values({
        id: uuidv7(), firmId,
        caseId, matterId: null,
        movementDate: m.movementDate, movementType: m.movementType,
        description: m.description, volume: m.volume, folio: m.folio,
        documentUrl: m.documentUrl,
        createdBy: userId, updatedBy: userId,
      });
    }

    // d. Copiar documents
    const matterDocs = await tx.select().from(documents)
      .where(and(eq(documents.matterId, matterId), eq(documents.firmId, firmId)));
    for (const d of matterDocs) {
      await tx.insert(documents).values({
        id: uuidv7(), firmId,
        caseId, matterId: null, movementId: null,
        fileName: d.fileName, fileUrl: d.fileUrl, fileSize: d.fileSize,
        mimeType: d.mimeType, category: d.category, notes: d.notes,
        createdBy: userId, updatedBy: userId,
      });
    }

    // e. Copiar events
    const matterEvents = await tx.select().from(events)
      .where(and(eq(events.matterId, matterId), eq(events.firmId, firmId)));
    for (const e of matterEvents) {
      await tx.insert(events).values({
        id: uuidv7(), firmId,
        caseId, matterId: null,
        eventType: e.eventType, title: e.title, description: e.description,
        eventDate: e.eventDate, eventTime: e.eventTime,
        endDate: e.endDate, endTime: e.endTime,
        isAllDay: e.isAllDay, assignedToId: e.assignedToId,
        status: e.status, reminderMinutesBefore: e.reminderMinutesBefore,
        createdBy: userId, updatedBy: userId,
      });
    }

    // f. y g. Marcar matter como convertido y completado
    await tx.update(matters).set({
      convertedToCaseId: caseId,
      status: matterStatus.COMPLETED,
      updatedBy: userId, updatedAt: new Date(),
    }).where(eq(matters.id, matterId));
  });

  // Devolver el case creado
  const [newCase] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  return newCase!;
}
