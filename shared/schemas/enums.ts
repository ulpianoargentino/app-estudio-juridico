// Enums del dominio como const objects. Se usan tanto para defaults de columnas
// Drizzle (backend) como para validación Zod en los schemas de este directorio.

export const userRole = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;
export type UserRole = (typeof userRole)[keyof typeof userRole];

export const personType = {
  INDIVIDUAL: "INDIVIDUAL",
  LEGAL_ENTITY: "LEGAL_ENTITY",
} as const;
export type PersonType = (typeof personType)[keyof typeof personType];

export const caseStatus = {
  INITIAL: "INITIAL",
  IN_PROGRESS: "IN_PROGRESS",
  EVIDENCE_STAGE: "EVIDENCE_STAGE",
  CLOSING_ARGUMENTS: "CLOSING_ARGUMENTS",
  AWAITING_JUDGMENT: "AWAITING_JUDGMENT",
  JUDGMENT_ISSUED: "JUDGMENT_ISSUED",
  IN_EXECUTION: "IN_EXECUTION",
  ARCHIVED: "ARCHIVED",
  SUSPENDED: "SUSPENDED",
  IN_MEDIATION: "IN_MEDIATION",
} as const;
export type CaseStatus = (typeof caseStatus)[keyof typeof caseStatus];

export const jurisdictionType = {
  CIVIL_COMMERCIAL: "CIVIL_COMMERCIAL",
  LABOR: "LABOR",
  CRIMINAL: "CRIMINAL",
  FAMILY: "FAMILY",
  ADMINISTRATIVE: "ADMINISTRATIVE",
  COLLECTIONS: "COLLECTIONS",
  PROBATE: "PROBATE",
  EXTRAJUDICIAL: "EXTRAJUDICIAL",
} as const;
export type JurisdictionType = (typeof jurisdictionType)[keyof typeof jurisdictionType];

export const matterType = {
  CONSULTATION: "CONSULTATION",
  CONTRACT: "CONTRACT",
  NEGOTIATION: "NEGOTIATION",
  ADVISORY: "ADVISORY",
  OPINION: "OPINION",
  OTHER: "OTHER",
} as const;
export type MatterType = (typeof matterType)[keyof typeof matterType];

export const matterStatus = {
  ACTIVE: "ACTIVE",
  ON_HOLD: "ON_HOLD",
  COMPLETED: "COMPLETED",
  ARCHIVED: "ARCHIVED",
} as const;
export type MatterStatus = (typeof matterStatus)[keyof typeof matterStatus];

export const partyRole = {
  PLAINTIFF: "PLAINTIFF",
  DEFENDANT: "DEFENDANT",
  ATTORNEY: "ATTORNEY",
  PROCESS_SERVER: "PROCESS_SERVER",
  EXPERT_WITNESS: "EXPERT_WITNESS",
  WITNESS: "WITNESS",
  JUDGE: "JUDGE",
  CLERK: "CLERK",
  CLIENT: "CLIENT",
  OPPOSING_PARTY: "OPPOSING_PARTY",
} as const;
export type PartyRole = (typeof partyRole)[keyof typeof partyRole];

export const errandType = {
  SERVICE_NOTICE: "SERVICE_NOTICE",
  COURT_ORDER_WRIT: "COURT_ORDER_WRIT",
  OFFICIAL_LETTER: "OFFICIAL_LETTER",
  ROGATORY_LETTER: "ROGATORY_LETTER",
  OTHER: "OTHER",
} as const;
export type ErrandType = (typeof errandType)[keyof typeof errandType];

export const errandStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;
export type ErrandStatus = (typeof errandStatus)[keyof typeof errandStatus];

export const eventType = {
  HEARING: "HEARING",
  DEADLINE: "DEADLINE",
  MEETING: "MEETING",
  MEDIATION: "MEDIATION",
  COURT_VISIT: "COURT_VISIT",
  OTHER: "OTHER",
} as const;
export type EventType = (typeof eventType)[keyof typeof eventType];

export const eventStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type EventStatus = (typeof eventStatus)[keyof typeof eventStatus];

export const documentCategory = {
  FILING: "FILING",
  RESOLUTION: "RESOLUTION",
  EVIDENCE: "EVIDENCE",
  EXPERT_REPORT: "EXPERT_REPORT",
  CORRESPONDENCE: "CORRESPONDENCE",
  OTHER: "OTHER",
} as const;
export type DocumentCategory = (typeof documentCategory)[keyof typeof documentCategory];

export const notificationType = {
  PORTAL_UPDATE: "PORTAL_UPDATE",
  DEADLINE_REMINDER: "DEADLINE_REMINDER",
  SYSTEM: "SYSTEM",
} as const;
export type NotificationType = (typeof notificationType)[keyof typeof notificationType];

export const caseLinkType = {
  RELATED: "RELATED",
  ACCUMULATED: "ACCUMULATED",
  INCIDENT: "INCIDENT",
} as const;
export type CaseLinkType = (typeof caseLinkType)[keyof typeof caseLinkType];

export const portal = {
  MEV_BUENOS_AIRES: "MEV_BUENOS_AIRES",
  SAE_TUCUMAN: "SAE_TUCUMAN",
} as const;
export type Portal = (typeof portal)[keyof typeof portal];

// Utilitario: convertir el const map en la tupla que requiere z.enum
export function enumValues<T extends Record<string, string>>(
  obj: T
): [T[keyof T], ...T[keyof T][]] {
  const values = Object.values(obj) as T[keyof T][];
  return values as [T[keyof T], ...T[keyof T][]];
}
