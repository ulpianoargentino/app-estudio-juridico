import { eq, and, desc, gte } from "drizzle-orm";
import { db } from "../db";
import { cases, movements, events, persons } from "../models";
import * as caseService from "../services/case.service";
import * as personService from "../services/person.service";

interface ToolInput {
  [key: string]: unknown;
}

interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Executes a tool invoked by the LLM.
 * firmId is injected by the caller — the LLM never controls which firm's data it accesses.
 */
export async function executeTool(
  toolName: string,
  input: ToolInput,
  firmId: string
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case "searchCases":
        return await handleSearchCases(input, firmId);
      case "getCaseDetail":
        return await handleGetCaseDetail(input, firmId);
      case "listMovements":
        return await handleListMovements(input, firmId);
      case "queryCalendar":
        return await handleQueryCalendar(input, firmId);
      case "searchPerson":
        return await handleSearchPerson(input, firmId);
      default:
        return { success: false, error: `Herramienta desconocida: ${toolName}` };
    }
  } catch (error: unknown) {
    console.error(`[ai-service] Tool execution failed (${toolName}):`, (error as Error).message);
    return { success: false, error: (error as Error).message };
  }
}

async function handleSearchCases(input: ToolInput, firmId: string): Promise<ToolResult> {
  const query = input.query as string;
  const status = input.status as string | undefined;
  const jurisdictionType = input.jurisdictionType as string | undefined;

  const result = await caseService.findAll(firmId, {
    page: 1,
    limit: 10,
    search: query,
    status,
    jurisdictionType,
    sort: "updated_at",
    order: "desc",
  });

  return {
    success: true,
    data: {
      cases: result.data.map((c) => ({
        id: c.id,
        caseNumber: c.caseNumber,
        caseTitle: c.caseTitle,
        status: c.status,
        jurisdictionType: c.jurisdictionType,
        primaryClientName: c.primaryClientName,
        responsibleAttorneyName: c.responsibleAttorneyName,
      })),
      total: result.meta.total,
    },
  };
}

async function handleGetCaseDetail(input: ToolInput, firmId: string): Promise<ToolResult> {
  const caseId = input.caseId as string;
  const detail = await caseService.findById(firmId, caseId);
  return { success: true, data: detail };
}

async function handleListMovements(input: ToolInput, firmId: string): Promise<ToolResult> {
  const caseId = input.caseId as string;
  const limit = (input.limit as number) || 20;

  const result = await db
    .select()
    .from(movements)
    .where(and(eq(movements.caseId, caseId), eq(movements.firmId, firmId)))
    .orderBy(desc(movements.movementDate))
    .limit(limit);

  return { success: true, data: result };
}

async function handleQueryCalendar(input: ToolInput, firmId: string): Promise<ToolResult> {
  const days = (input.days as number) || 7;
  const caseId = input.caseId as string | undefined;

  const now = new Date();
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const conditions = [
    eq(events.firmId, firmId),
    gte(events.eventDate, now),
  ];

  if (caseId) {
    conditions.push(eq(events.caseId, caseId));
  }

  const result = await db
    .select()
    .from(events)
    .where(and(...conditions))
    .orderBy(events.eventDate)
    .limit(50);

  return { success: true, data: result };
}

async function handleSearchPerson(input: ToolInput, firmId: string): Promise<ToolResult> {
  const query = input.query as string;
  const results = await personService.search(firmId, query);
  return { success: true, data: results };
}
