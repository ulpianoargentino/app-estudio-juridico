import { eq, and, or, ilike, asc, desc, count, gte, lte, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { cases, persons, users, courts, events, errands, matters } from "../models";

// --- Cases report ---

interface CasesReportFilters {
  page?: number;
  limit?: number;
  export?: boolean;
  status?: string[];
  jurisdictionType?: string[];
  responsibleAttorneyId?: string;
  primaryClientId?: string;
  courtId?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  claimedAmountMin?: number;
  claimedAmountMax?: number;
  isActive?: boolean;
  sort: string;
  order: string;
}

const caseSortColumns = {
  updated_at: cases.updatedAt,
  created_at: cases.createdAt,
  case_title: cases.caseTitle,
  case_number: cases.caseNumber,
  start_date: cases.startDate,
  claimed_amount: cases.claimedAmount,
} as const;

export async function findCasesForReport(firmId: string, filters: CasesReportFilters) {
  const conditions = [eq(cases.firmId, firmId)];

  if (filters.isActive !== undefined) {
    conditions.push(eq(cases.isActive, filters.isActive));
  } else {
    conditions.push(eq(cases.isActive, true));
  }

  if (filters.status && filters.status.length > 0) {
    conditions.push(inArray(cases.status, filters.status));
  }
  if (filters.jurisdictionType && filters.jurisdictionType.length > 0) {
    conditions.push(inArray(cases.jurisdictionType, filters.jurisdictionType));
  }
  if (filters.responsibleAttorneyId) {
    conditions.push(eq(cases.responsibleAttorneyId, filters.responsibleAttorneyId));
  }
  if (filters.primaryClientId) {
    conditions.push(eq(cases.primaryClientId, filters.primaryClientId));
  }
  if (filters.courtId) {
    conditions.push(eq(cases.courtId, filters.courtId));
  }
  if (filters.startDateFrom) {
    conditions.push(gte(cases.startDate, filters.startDateFrom));
  }
  if (filters.startDateTo) {
    conditions.push(lte(cases.startDate, filters.startDateTo));
  }
  if (filters.claimedAmountMin !== undefined) {
    conditions.push(gte(cases.claimedAmount, String(filters.claimedAmountMin)));
  }
  if (filters.claimedAmountMax !== undefined) {
    conditions.push(lte(cases.claimedAmount, String(filters.claimedAmountMax)));
  }

  const where = and(...conditions);
  const sortCol = caseSortColumns[filters.sort as keyof typeof caseSortColumns] ?? cases.updatedAt;
  const orderFn = filters.order === "asc" ? asc : desc;

  const baseQuery = db
    .select({
      id: cases.id,
      caseNumber: cases.caseNumber,
      caseTitle: cases.caseTitle,
      jurisdictionType: cases.jurisdictionType,
      status: cases.status,
      startDate: cases.startDate,
      claimedAmount: cases.claimedAmount,
      currency: cases.currency,
      updatedAt: cases.updatedAt,
      courtName: courts.name,
      clientFirstName: persons.firstName,
      clientLastName: persons.lastName,
      clientBusinessName: persons.businessName,
      attorneyFirstName: users.firstName,
      attorneyLastName: users.lastName,
    })
    .from(cases)
    .leftJoin(courts, eq(cases.courtId, courts.id))
    .leftJoin(persons, eq(cases.primaryClientId, persons.id))
    .leftJoin(users, eq(cases.responsibleAttorneyId, users.id))
    .where(where)
    .orderBy(orderFn(sortCol));

  if (filters.export) {
    // No pagination for export
    const data = await baseQuery;
    return { data: formatCasesRows(data), meta: { total: data.length } };
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const offset = (page - 1) * limit;

  const [data, totalResult] = await Promise.all([
    baseQuery.limit(limit).offset(offset),
    db.select({ count: count() }).from(cases).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return {
    data: formatCasesRows(data),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

function formatCasesRows(rows: Array<Record<string, unknown>>) {
  return rows.map((row: any) => ({
    id: row.id,
    caseNumber: row.caseNumber,
    caseTitle: row.caseTitle,
    jurisdictionType: row.jurisdictionType,
    status: row.status,
    startDate: row.startDate,
    claimedAmount: row.claimedAmount,
    currency: row.currency,
    updatedAt: row.updatedAt,
    courtName: row.courtName ?? null,
    responsibleAttorneyName: row.attorneyFirstName && row.attorneyLastName
      ? `${row.attorneyLastName}, ${row.attorneyFirstName}`
      : null,
    primaryClientName: row.clientBusinessName || (row.clientFirstName && row.clientLastName
      ? `${row.clientLastName}, ${row.clientFirstName}`
      : null),
  }));
}

// --- Deadlines report ---

interface DeadlinesReportFilters {
  days: number;
  assignedToId?: string;
}

export async function findDeadlines(firmId: string, filters: DeadlinesReportFilters) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + filters.days);

  const conditions = [
    eq(events.firmId, firmId),
    eq(events.eventType, "DEADLINE"),
    // Include overdue + upcoming within range
    lte(events.eventDate, futureDate),
  ];

  if (filters.assignedToId) {
    conditions.push(eq(events.assignedToId, filters.assignedToId));
  }

  const data = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      eventDate: events.eventDate,
      status: events.status,
      assignedToId: events.assignedToId,
      caseId: events.caseId,
      matterId: events.matterId,
      caseCaseNumber: cases.caseNumber,
      caseCaseTitle: cases.caseTitle,
      matterTitle: matters.title,
      assignedFirstName: users.firstName,
      assignedLastName: users.lastName,
    })
    .from(events)
    .leftJoin(cases, eq(events.caseId, cases.id))
    .leftJoin(matters, eq(events.matterId, matters.id))
    .leftJoin(users, eq(events.assignedToId, users.id))
    .where(and(...conditions))
    .orderBy(asc(events.eventDate));

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    eventDate: row.eventDate,
    status: row.status,
    assignedToName: row.assignedFirstName && row.assignedLastName
      ? `${row.assignedLastName}, ${row.assignedFirstName}`
      : null,
    caseId: row.caseId,
    matterId: row.matterId,
    linkedName: row.caseCaseTitle ?? row.matterTitle ?? null,
    linkedNumber: row.caseCaseNumber ?? null,
    isOverdue: row.eventDate < now && row.status === "PENDING",
  }));
}

// --- Errands report ---

interface ErrandsReportFilters {
  errandType?: string;
  responsibleId?: string;
  status?: string;
}

export async function findErrands(firmId: string, filters: ErrandsReportFilters) {
  const conditions = [eq(errands.firmId, firmId)];

  if (filters.errandType) {
    conditions.push(eq(errands.errandType, filters.errandType));
  }
  if (filters.responsibleId) {
    conditions.push(eq(errands.responsibleId, filters.responsibleId));
  }
  if (filters.status) {
    conditions.push(eq(errands.status, filters.status));
  }

  const data = await db
    .select({
      id: errands.id,
      errandType: errands.errandType,
      status: errands.status,
      dueDate: errands.dueDate,
      completedDate: errands.completedDate,
      notes: errands.notes,
      caseId: errands.caseId,
      caseCaseNumber: cases.caseNumber,
      caseCaseTitle: cases.caseTitle,
      responsibleFirstName: users.firstName,
      responsibleLastName: users.lastName,
    })
    .from(errands)
    .leftJoin(cases, eq(errands.caseId, cases.id))
    .leftJoin(users, eq(errands.responsibleId, users.id))
    .where(and(...conditions))
    .orderBy(asc(errands.dueDate));

  return data.map((row) => ({
    id: row.id,
    errandType: row.errandType,
    status: row.status,
    dueDate: row.dueDate,
    completedDate: row.completedDate,
    notes: row.notes,
    caseId: row.caseId,
    caseCaseNumber: row.caseCaseNumber,
    caseCaseTitle: row.caseCaseTitle,
    responsibleName: row.responsibleFirstName && row.responsibleLastName
      ? `${row.responsibleLastName}, ${row.responsibleFirstName}`
      : null,
  }));
}
