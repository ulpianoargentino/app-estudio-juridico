import { eq, and, or, ilike, asc, desc, count, gte, sql, inArray, isNull } from "drizzle-orm";
import { db } from "../db";
import { cases, persons, users, courts, parties, movements, documents, events, caseLinks } from "../models";
import { uuidv7 } from "../utils/uuid";
import { AppError } from "../middleware/error-handler";
import { caseLinkType } from "@shared";
import type { CaseCreateInput, CaseUpdateInput, CaseQuery, SubCaseCreateInput, SubCaseType } from "@shared";

// Prefijo sugerido para el número del sub según el tipo. La sugerencia se
// genera en /sub-cases/next-number y el frontend la muestra como placeholder
// del input — el usuario puede aceptarla, editarla o dejar el campo vacío.
export const SUB_CASE_PREFIX: Record<SubCaseType, string> = {
  EVIDENCE: "A",
  INCIDENT: "I",
  OTHER: "X",
};

type CreateCaseData = CaseCreateInput;
type UpdateCaseData = CaseUpdateInput;
type FindAllFilters = CaseQuery;

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

  // El listado principal sólo trae padres/expedientes normales. Los sub
  // (subCaseType IS NOT NULL) se ven dentro de la tab "Subexpedientes" del padre.
  const conditions = [eq(cases.firmId, firmId), isNull(cases.subCaseType)];

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

  // Conteo batch de subexpedientes activos para los padres devueltos.
  // Se cuentan hijos (cases) que tengan link SUB_CASE en case_links donde
  // case_id_1 = padre.id, y que estén activos.
  const parentIds = data.map((r) => r.id);
  const subCounts = await getSubCaseCounts(firmId, parentIds);

  // Format response to include client/attorney names + sub count
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
    subCaseType: null as string | null,
    subCaseNumber: null as string | null,
    subCaseDescription: null as string | null,
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
    subCaseCount: subCounts[row.id] ?? 0,
  }));

  return {
    data: formatted,
    meta: { total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) },
  };
}

// Cuenta hijos activos por padre. Devuelve un mapa { parentId: count }.
// Se usa en findAll (batch para el listado) y en findById (un solo padre).
export async function getSubCaseCounts(
  firmId: string,
  parentIds: string[]
): Promise<Record<string, number>> {
  if (parentIds.length === 0) return {};
  const rows = await db
    .select({
      parentId: caseLinks.caseId1,
      count: count(cases.id),
    })
    .from(caseLinks)
    .innerJoin(cases, eq(caseLinks.caseId2, cases.id))
    .where(
      and(
        eq(caseLinks.firmId, firmId),
        eq(caseLinks.linkType, caseLinkType.SUB_CASE),
        inArray(caseLinks.caseId1, parentIds),
        eq(cases.isActive, true)
      )
    )
    .groupBy(caseLinks.caseId1);
  const map: Record<string, number> = {};
  for (const r of rows) map[r.parentId] = r.count;
  return map;
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

  // Si el case es un sub, buscar el padre (para el banner del frontend).
  // Si es un padre/normal, contar sus hijos activos (para la tab Subexpedientes).
  let parent: { id: string; caseNumber: string | null; caseTitle: string } | null = null;
  let subCaseCount = 0;

  if (caseRow.subCaseType) {
    const [parentLink] = await db
      .select({
        id: cases.id,
        caseNumber: cases.caseNumber,
        caseTitle: cases.caseTitle,
      })
      .from(caseLinks)
      .innerJoin(cases, eq(caseLinks.caseId1, cases.id))
      .where(
        and(
          eq(caseLinks.firmId, firmId),
          eq(caseLinks.linkType, caseLinkType.SUB_CASE),
          eq(caseLinks.caseId2, id)
        )
      )
      .limit(1);
    parent = parentLink ?? null;
  } else {
    const counts = await getSubCaseCounts(firmId, [id]);
    subCaseCount = counts[id] ?? 0;
  }

  return {
    ...caseRow,
    court: courtData[0] ?? null,
    primaryClient: clientData[0] ?? null,
    responsibleAttorney: attorneyData[0] ?? null,
    parties: partyLinks,
    movementCount: movementCount[0]?.count ?? 0,
    documentCount: documentCount[0]?.count ?? 0,
    upcomingEventCount: upcomingEventCount[0]?.count ?? 0,
    parent,
    subCaseCount,
  };
}

export async function update(firmId: string, id: string, data: UpdateCaseData, userId: string) {
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

async function setActive(firmId: string, id: string, userId: string, isActive: boolean) {
  const [existing] = await db
    .select({ id: cases.id })
    .from(cases)
    .where(and(eq(cases.id, id), eq(cases.firmId, firmId)))
    .limit(1);
  if (!existing) throw new AppError(404, "CASE_NOT_FOUND", "Expediente no encontrado");

  await db
    .update(cases)
    .set({ isActive, updatedBy: userId, updatedAt: new Date() })
    .where(and(eq(cases.id, id), eq(cases.firmId, firmId)));
}

// Archivar el padre archiva en cascada todos los hijos activos
// (transaccional). Desarchivar NO desarchiva en cascada — cada hijo se
// desarchiva manualmente desde su propio detalle.
export async function archive(firmId: string, id: string, userId: string) {
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: cases.id, subCaseType: cases.subCaseType })
      .from(cases)
      .where(and(eq(cases.id, id), eq(cases.firmId, firmId)))
      .limit(1);
    if (!existing) throw new AppError(404, "CASE_NOT_FOUND", "Expediente no encontrado");

    const now = new Date();
    await tx
      .update(cases)
      .set({ isActive: false, updatedBy: userId, updatedAt: now })
      .where(and(eq(cases.id, id), eq(cases.firmId, firmId)));

    // Sólo archivamos hijos cuando el case es un padre (no sub de sub).
    if (!existing.subCaseType) {
      const childRows = await tx
        .select({ childId: caseLinks.caseId2 })
        .from(caseLinks)
        .where(
          and(
            eq(caseLinks.firmId, firmId),
            eq(caseLinks.linkType, caseLinkType.SUB_CASE),
            eq(caseLinks.caseId1, id)
          )
        );
      const childIds = childRows.map((r) => r.childId);
      if (childIds.length > 0) {
        await tx
          .update(cases)
          .set({ isActive: false, updatedBy: userId, updatedAt: now })
          .where(
            and(
              eq(cases.firmId, firmId),
              inArray(cases.id, childIds),
              eq(cases.isActive, true)
            )
          );
      }
    }
  });
}

export async function unarchive(firmId: string, id: string, userId: string) {
  await setActive(firmId, id, userId, true);
}

// Crea un sub-expediente vinculado al padre. Modelo flexible:
//   - Tipo y número son opcionales (texto libre el segundo). Si el usuario no
//     los manda, el sub queda con esos campos en NULL.
//   - Carátula opcional: si viene, se usa; si no, se hereda del padre.
//   - Resto siempre se hereda del padre: court, primaryClient,
//     responsibleAttorney, jurisdictionType, jurisdiction, processType,
//     currency, startDate, status.
// Validaciones:
//   - El padre debe existir y pertenecer al firm.
//   - El padre NO puede ser él mismo un sub (no sub-de-sub).
// El campo `case_number` del sub queda en NULL — la UI muestra el número
// computado como "{padre.caseNumber}-{sub.subCaseNumber}" cuando aplica.
export async function createSubCase(
  firmId: string,
  parentId: string,
  data: SubCaseCreateInput,
  userId: string
) {
  return db.transaction(async (tx) => {
    const [parent] = await tx
      .select()
      .from(cases)
      .where(and(eq(cases.id, parentId), eq(cases.firmId, firmId)))
      .limit(1);
    if (!parent) throw new AppError(404, "CASE_NOT_FOUND", "Expediente padre no encontrado");
    if (parent.subCaseType) {
      throw new AppError(
        400,
        "NESTED_SUB_CASE_NOT_ALLOWED",
        "Los subexpedientes no pueden tener subexpedientes"
      );
    }

    // Normalizar strings vacíos a null para que la DB no guarde "".
    const normalizedNumber = data.subCaseNumber?.trim() || null;
    const normalizedTitle = data.caseTitle?.trim();
    const childTitle = normalizedTitle && normalizedTitle.length > 0
      ? normalizedTitle
      : parent.caseTitle;

    const childId = uuidv7();
    const [child] = await tx
      .insert(cases)
      .values({
        id: childId,
        firmId,
        caseNumber: null, // los subs no usan case_number propio; se computa en UI
        caseTitle: childTitle,
        jurisdictionType: parent.jurisdictionType,
        jurisdiction: parent.jurisdiction,
        courtId: parent.courtId,
        processType: parent.processType,
        status: parent.status,
        primaryClientId: parent.primaryClientId,
        responsibleAttorneyId: parent.responsibleAttorneyId,
        startDate: parent.startDate,
        claimedAmount: null,
        currency: parent.currency,
        portalUrl: null,
        notes: data.notes?.trim() || null,
        subCaseType: data.subCaseType ?? null,
        subCaseNumber: normalizedNumber,
        subCaseDescription: data.subCaseDescription?.trim() || null,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    await tx.insert(caseLinks).values({
      id: uuidv7(),
      firmId,
      caseId1: parentId, // padre
      caseId2: childId, // hijo
      linkType: caseLinkType.SUB_CASE,
      notes: null,
      createdBy: userId,
      updatedBy: userId,
    });

    return child!;
  });
}

// Lista los subs (activos + archivados) de un padre. Devuelve también
// `parentCaseNumber` en cada row para que el frontend pueda renderizar
// "{padre.caseNumber}-{sub.subCaseNumber}" sin un fetch extra.
// Orden: por createdAt asc (orden cronológico de carga).
export async function listSubCases(firmId: string, parentId: string) {
  // Validar que el padre existe y pertenece al firm.
  const [parent] = await db
    .select({ id: cases.id, caseNumber: cases.caseNumber })
    .from(cases)
    .where(and(eq(cases.id, parentId), eq(cases.firmId, firmId)))
    .limit(1);
  if (!parent) throw new AppError(404, "CASE_NOT_FOUND", "Expediente no encontrado");

  const rows = await db
    .select({
      id: cases.id,
      caseTitle: cases.caseTitle,
      status: cases.status,
      subCaseType: cases.subCaseType,
      subCaseNumber: cases.subCaseNumber,
      subCaseDescription: cases.subCaseDescription,
      isActive: cases.isActive,
      createdAt: cases.createdAt,
    })
    .from(caseLinks)
    .innerJoin(cases, eq(caseLinks.caseId2, cases.id))
    .where(
      and(
        eq(caseLinks.firmId, firmId),
        eq(caseLinks.linkType, caseLinkType.SUB_CASE),
        eq(caseLinks.caseId1, parentId)
      )
    )
    .orderBy(asc(cases.createdAt));

  return rows.map((r) => ({ ...r, parentCaseNumber: parent.caseNumber }));
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
