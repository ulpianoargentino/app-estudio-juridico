import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { cases, persons, courts, parties, firms, users } from "../models";

// All available template variables with their display labels (for UI)
export interface TemplateVariable {
  key: string;
  label: string;
  category: string;
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  // Expediente
  { key: "CASE_NUMBER", label: "Numero de expediente", category: "case" },
  { key: "CASE_TITLE", label: "Caratula", category: "case" },
  { key: "JURISDICTION_TYPE", label: "Fuero", category: "case" },
  { key: "JURISDICTION", label: "Jurisdiccion", category: "case" },
  { key: "PROCESS_TYPE", label: "Tipo de proceso", category: "case" },
  { key: "STATUS", label: "Estado del expediente", category: "case" },
  { key: "START_DATE", label: "Fecha de inicio", category: "case" },
  { key: "CLAIMED_AMOUNT", label: "Monto reclamado", category: "case" },
  { key: "CURRENCY", label: "Moneda", category: "case" },

  // Juzgado
  { key: "COURT_NAME", label: "Nombre del juzgado", category: "court" },
  { key: "COURT_TYPE", label: "Tipo de juzgado", category: "court" },
  { key: "COURT_JURISDICTION", label: "Jurisdiccion del juzgado", category: "court" },
  { key: "COURT_ADDRESS", label: "Direccion del juzgado", category: "court" },

  // Partes
  { key: "PLAINTIFF_NAME", label: "Nombre del actor", category: "party" },
  { key: "PLAINTIFF_CUIT", label: "CUIT/CUIL del actor", category: "party" },
  { key: "PLAINTIFF_ADDRESS", label: "Domicilio del actor", category: "party" },
  { key: "PLAINTIFF_LEGAL_ADDRESS", label: "Domicilio legal del actor", category: "party" },
  { key: "DEFENDANT_NAME", label: "Nombre del demandado", category: "party" },
  { key: "DEFENDANT_CUIT", label: "CUIT/CUIL del demandado", category: "party" },
  { key: "DEFENDANT_ADDRESS", label: "Domicilio del demandado", category: "party" },
  { key: "DEFENDANT_LEGAL_ADDRESS", label: "Domicilio legal del demandado", category: "party" },
  { key: "CLIENT_NAME", label: "Nombre del cliente", category: "party" },
  { key: "CLIENT_CUIT", label: "CUIT/CUIL del cliente", category: "party" },
  { key: "CLIENT_ADDRESS", label: "Domicilio del cliente", category: "party" },
  { key: "CLIENT_LEGAL_ADDRESS", label: "Domicilio legal del cliente", category: "party" },

  // Abogado
  { key: "ATTORNEY_NAME", label: "Nombre del abogado responsable", category: "attorney" },
  { key: "ATTORNEY_EMAIL", label: "Email del abogado responsable", category: "attorney" },

  // Estudio
  { key: "FIRM_NAME", label: "Nombre del estudio", category: "firm" },

  // Fecha actual
  { key: "CURRENT_DATE", label: "Fecha actual", category: "date" },
  { key: "CURRENT_DATE_LONG", label: "Fecha actual (formato largo)", category: "date" },
];

export const VARIABLE_KEYS = TEMPLATE_VARIABLES.map((v) => v.key);

function formatPersonName(person: { firstName: string; lastName: string; businessName: string | null; personType: string }): string {
  if (person.personType === "LEGAL_ENTITY" && person.businessName) {
    return person.businessName;
  }
  return `${person.lastName}, ${person.firstName}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Jurisdiction type labels for display in documents
const jurisdictionTypeLabels: Record<string, string> = {
  CIVIL_COMMERCIAL: "Civil y Comercial",
  LABOR: "Laboral",
  CRIMINAL: "Penal",
  FAMILY: "Familia",
  ADMINISTRATIVE: "Contencioso Administrativo",
  COLLECTIONS: "Cobros y Apremios",
  PROBATE: "Sucesiones",
  EXTRAJUDICIAL: "Extrajudicial",
};

// Case status labels for display in documents
const caseStatusLabels: Record<string, string> = {
  INITIAL: "Inicio",
  IN_PROGRESS: "En tramite",
  EVIDENCE_STAGE: "En prueba",
  CLOSING_ARGUMENTS: "Alegatos",
  AWAITING_JUDGMENT: "Para sentencia",
  JUDGMENT_ISSUED: "Sentencia",
  IN_EXECUTION: "En ejecucion",
  ARCHIVED: "Archivado",
  SUSPENDED: "Paralizado",
  IN_MEDIATION: "Mediacion",
};

// Resolve all variables for a given case, returning a key-value map
export async function resolveVariables(
  firmId: string,
  caseId: string
): Promise<Record<string, string>> {
  const values: Record<string, string> = {};

  // Fetch case
  const [caseRow] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, caseId), eq(cases.firmId, firmId)))
    .limit(1);

  if (!caseRow) return values;

  // Case fields
  values["CASE_NUMBER"] = caseRow.caseNumber ?? "";
  values["CASE_TITLE"] = caseRow.caseTitle;
  values["JURISDICTION_TYPE"] = jurisdictionTypeLabels[caseRow.jurisdictionType] ?? caseRow.jurisdictionType;
  values["JURISDICTION"] = caseRow.jurisdiction ?? "";
  values["PROCESS_TYPE"] = caseRow.processType ?? "";
  values["STATUS"] = caseStatusLabels[caseRow.status] ?? caseRow.status;
  values["START_DATE"] = caseRow.startDate ? formatDate(caseRow.startDate) : "";
  values["CLAIMED_AMOUNT"] = caseRow.claimedAmount ?? "";
  values["CURRENCY"] = caseRow.currency ?? "ARS";

  // Parallel fetches for court, parties, attorney, firm
  const [courtData, partyRows, attorneyData, firmData] = await Promise.all([
    caseRow.courtId
      ? db.select().from(courts).where(and(eq(courts.id, caseRow.courtId), eq(courts.firmId, firmId))).limit(1)
      : Promise.resolve([]),
    db
      .select({
        role: parties.role,
        firstName: persons.firstName,
        lastName: persons.lastName,
        businessName: persons.businessName,
        personType: persons.personType,
        cuitCuil: persons.cuitCuil,
        addressStreet: persons.addressStreet,
        legalAddress: persons.legalAddress,
      })
      .from(parties)
      .leftJoin(persons, eq(parties.personId, persons.id))
      .where(and(eq(parties.caseId, caseId), eq(parties.firmId, firmId))),
    caseRow.responsibleAttorneyId
      ? db.select({ firstName: users.firstName, lastName: users.lastName, email: users.email })
          .from(users).where(eq(users.id, caseRow.responsibleAttorneyId)).limit(1)
      : Promise.resolve([]),
    db.select({ name: firms.name }).from(firms).where(eq(firms.id, firmId)).limit(1),
  ]);

  // Court
  const court = courtData[0];
  values["COURT_NAME"] = court?.name ?? "";
  values["COURT_TYPE"] = court?.courtType ?? "";
  values["COURT_JURISDICTION"] = court?.jurisdiction ?? "";
  values["COURT_ADDRESS"] = court?.address ?? "";

  // Parties by role
  const findPartyByRole = (role: string) => partyRows.find((p: typeof partyRows[number]) => p.role === role);

  const plaintiff = findPartyByRole("PLAINTIFF");
  values["PLAINTIFF_NAME"] = plaintiff ? formatPersonName(plaintiff as any) : "";
  values["PLAINTIFF_CUIT"] = plaintiff?.cuitCuil ?? "";
  values["PLAINTIFF_ADDRESS"] = plaintiff?.addressStreet ?? "";
  values["PLAINTIFF_LEGAL_ADDRESS"] = plaintiff?.legalAddress ?? "";

  const defendant = findPartyByRole("DEFENDANT");
  values["DEFENDANT_NAME"] = defendant ? formatPersonName(defendant as any) : "";
  values["DEFENDANT_CUIT"] = defendant?.cuitCuil ?? "";
  values["DEFENDANT_ADDRESS"] = defendant?.addressStreet ?? "";
  values["DEFENDANT_LEGAL_ADDRESS"] = defendant?.legalAddress ?? "";

  const client = findPartyByRole("CLIENT");
  values["CLIENT_NAME"] = client ? formatPersonName(client as any) : "";
  values["CLIENT_CUIT"] = client?.cuitCuil ?? "";
  values["CLIENT_ADDRESS"] = client?.addressStreet ?? "";
  values["CLIENT_LEGAL_ADDRESS"] = client?.legalAddress ?? "";

  // Attorney
  const attorney = attorneyData[0];
  values["ATTORNEY_NAME"] = attorney ? `${attorney.lastName}, ${attorney.firstName}` : "";
  values["ATTORNEY_EMAIL"] = attorney?.email ?? "";

  // Firm
  values["FIRM_NAME"] = firmData[0]?.name ?? "";

  // Current date
  const now = new Date();
  values["CURRENT_DATE"] = formatDate(now);
  values["CURRENT_DATE_LONG"] = formatDateLong(now);

  return values;
}

// Extract variable keys used in a template content string
export function extractVariableKeys(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const keys = new Set<string>();
  let match;
  while ((match = regex.exec(content)) !== null) {
    keys.add(match[1]!);
  }
  return Array.from(keys);
}
