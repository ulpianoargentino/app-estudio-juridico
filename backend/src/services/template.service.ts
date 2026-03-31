import { eq, and, ilike, asc } from "drizzle-orm";
import { db } from "../db";
import { templates, cases, persons, parties, courts } from "../models";
import { AppError } from "../middleware/error-handler";

interface FindAllFilters {
  category?: string;
  search?: string;
}

export async function findAll(firmId: string, filters: FindAllFilters = {}) {
  const conditions = [eq(templates.firmId, firmId), eq(templates.isActive, true)];

  if (filters.category) {
    conditions.push(eq(templates.category, filters.category));
  }
  if (filters.search) {
    conditions.push(ilike(templates.name, `%${filters.search}%`));
  }

  const rows = await db
    .select()
    .from(templates)
    .where(and(...conditions))
    .orderBy(asc(templates.name));

  return rows;
}

export async function findById(firmId: string, id: string) {
  const [template] = await db
    .select()
    .from(templates)
    .where(and(eq(templates.id, id), eq(templates.firmId, firmId)))
    .limit(1);

  if (!template) {
    throw new AppError(404, "TEMPLATE_NOT_FOUND", "Plantilla no encontrada");
  }
  return template;
}

// Resolves template variables with case data
export async function render(firmId: string, templateId: string, caseId: string) {
  const template = await findById(firmId, templateId);

  // Fetch case data with related entities
  const [caseRow] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, caseId), eq(cases.firmId, firmId)))
    .limit(1);

  if (!caseRow) {
    throw new AppError(404, "CASE_NOT_FOUND", "Expediente no encontrado");
  }

  // Fetch court if linked
  let courtRow = null;
  if (caseRow.courtId) {
    const [c] = await db
      .select()
      .from(courts)
      .where(and(eq(courts.id, caseRow.courtId), eq(courts.firmId, firmId)))
      .limit(1);
    courtRow = c ?? null;
  }

  // Fetch parties for role-based variables
  const caseParties = await db
    .select({
      role: parties.role,
      personId: parties.personId,
      firstName: persons.firstName,
      lastName: persons.lastName,
      businessName: persons.businessName,
    })
    .from(parties)
    .innerJoin(persons, eq(parties.personId, persons.id))
    .where(and(eq(parties.caseId, caseId), eq(parties.firmId, firmId)));

  // Fetch primary client
  let primaryClient = null;
  if (caseRow.primaryClientId) {
    const [p] = await db
      .select()
      .from(persons)
      .where(eq(persons.id, caseRow.primaryClientId))
      .limit(1);
    primaryClient = p ?? null;
  }

  // Build variable map
  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  const getPartyName = (role: string) => {
    const party = caseParties.find((p) => p.role === role);
    if (!party) return "";
    return party.businessName || `${party.lastName}, ${party.firstName}`;
  };

  const variables: Record<string, string> = {
    "{{fecha}}": dateFormatter.format(now),
    "{{fecha_corta}}": now.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }),
    "{{expediente}}": caseRow.caseNumber || "",
    "{{caratula}}": caseRow.caseTitle || "",
    "{{fuero}}": caseRow.jurisdictionType || "",
    "{{juzgado}}": courtRow?.name || "",
    "{{jurisdiccion}}": caseRow.jurisdiction || "",
    "{{actor}}": getPartyName("PLAINTIFF"),
    "{{demandado}}": getPartyName("DEFENDANT"),
    "{{abogado}}": getPartyName("ATTORNEY"),
    "{{cliente}}": primaryClient
      ? primaryClient.businessName || `${primaryClient.lastName}, ${primaryClient.firstName}`
      : "",
    "{{notas}}": caseRow.notes || "",
  };

  // Replace variables in template content
  let rendered = template.content;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replaceAll(key, value);
  }

  return {
    html: rendered,
    templateName: template.name,
    caseTitle: caseRow.caseTitle,
    variables,
  };
}
