import { eq, and, ne, count, sum, gte, desc, asc, sql } from "drizzle-orm";
import { db } from "../db";
import { cases, matters, events, movements, errands } from "../models";

export async function getStats(firmId: string) {
  const now = new Date();

  const [
    activeCasesResult,
    casesByStatusResult,
    casesByJurisdictionResult,
    activeMattersResult,
    upcomingEventsResult,
    upcomingDeadlinesResult,
    recentMovementsResult,
    claimedAmountResult,
    pendingErrandsResult,
  ] = await Promise.all([
    // totalActiveCases
    db
      .select({ count: count() })
      .from(cases)
      .where(
        and(
          eq(cases.firmId, firmId),
          eq(cases.isActive, true),
          ne(cases.status, "ARCHIVED")
        )
      ),

    // casesByStatus
    db
      .select({ status: cases.status, count: count() })
      .from(cases)
      .where(and(eq(cases.firmId, firmId), eq(cases.isActive, true)))
      .groupBy(cases.status),

    // casesByJurisdictionType
    db
      .select({ jurisdictionType: cases.jurisdictionType, count: count() })
      .from(cases)
      .where(
        and(
          eq(cases.firmId, firmId),
          eq(cases.isActive, true),
          ne(cases.status, "ARCHIVED")
        )
      )
      .groupBy(cases.jurisdictionType),

    // totalActiveMatters
    db
      .select({ count: count() })
      .from(matters)
      .where(
        and(
          eq(matters.firmId, firmId),
          eq(matters.isActive, true),
          eq(matters.status, "ACTIVE")
        )
      ),

    // upcomingEvents (next 5, excluding deadlines)
    db
      .select({
        id: events.id,
        eventType: events.eventType,
        title: events.title,
        eventDate: events.eventDate,
        eventTime: events.eventTime,
        caseId: events.caseId,
        matterId: events.matterId,
        status: events.status,
        caseNumber: cases.caseNumber,
        caseTitle: cases.caseTitle,
        matterTitle: matters.title,
      })
      .from(events)
      .leftJoin(cases, eq(events.caseId, cases.id))
      .leftJoin(matters, eq(events.matterId, matters.id))
      .where(
        and(
          eq(events.firmId, firmId),
          eq(events.status, "PENDING"),
          ne(events.eventType, "DEADLINE"),
          gte(events.eventDate, now)
        )
      )
      .orderBy(asc(events.eventDate))
      .limit(5),

    // upcomingDeadlines (next 5)
    db
      .select({
        id: events.id,
        eventType: events.eventType,
        title: events.title,
        eventDate: events.eventDate,
        eventTime: events.eventTime,
        caseId: events.caseId,
        matterId: events.matterId,
        status: events.status,
        caseNumber: cases.caseNumber,
        caseTitle: cases.caseTitle,
        matterTitle: matters.title,
      })
      .from(events)
      .leftJoin(cases, eq(events.caseId, cases.id))
      .leftJoin(matters, eq(events.matterId, matters.id))
      .where(
        and(
          eq(events.firmId, firmId),
          eq(events.status, "PENDING"),
          eq(events.eventType, "DEADLINE"),
          gte(events.eventDate, now)
        )
      )
      .orderBy(asc(events.eventDate))
      .limit(5),

    // recentMovements (last 10)
    db
      .select({
        id: movements.id,
        movementDate: movements.movementDate,
        movementType: movements.movementType,
        description: movements.description,
        caseId: movements.caseId,
        matterId: movements.matterId,
        caseNumber: cases.caseNumber,
        caseTitle: cases.caseTitle,
        matterTitle: matters.title,
      })
      .from(movements)
      .leftJoin(cases, eq(movements.caseId, cases.id))
      .leftJoin(matters, eq(movements.matterId, matters.id))
      .where(eq(movements.firmId, firmId))
      .orderBy(desc(movements.movementDate))
      .limit(10),

    // totalClaimedAmount (sum of claimed_amount for active cases, ARS)
    db
      .select({ total: sum(cases.claimedAmount) })
      .from(cases)
      .where(
        and(
          eq(cases.firmId, firmId),
          eq(cases.isActive, true),
          ne(cases.status, "ARCHIVED"),
          eq(cases.currency, "ARS")
        )
      ),

    // pendingErrands
    db
      .select({ count: count() })
      .from(errands)
      .where(and(eq(errands.firmId, firmId), eq(errands.status, "PENDING"))),
  ]);

  const casesByStatus: Record<string, number> = {};
  for (const row of casesByStatusResult) {
    casesByStatus[row.status] = row.count;
  }

  const casesByJurisdictionType: Record<string, number> = {};
  for (const row of casesByJurisdictionResult) {
    casesByJurisdictionType[row.jurisdictionType] = row.count;
  }

  return {
    totalActiveCases: activeCasesResult[0]?.count ?? 0,
    casesByStatus,
    casesByJurisdictionType,
    totalActiveMatters: activeMattersResult[0]?.count ?? 0,
    upcomingEvents: upcomingEventsResult,
    upcomingDeadlines: upcomingDeadlinesResult,
    recentMovements: recentMovementsResult,
    totalClaimedAmount: claimedAmountResult[0]?.total ?? "0",
    pendingErrands: pendingErrandsResult[0]?.count ?? 0,
  };
}
