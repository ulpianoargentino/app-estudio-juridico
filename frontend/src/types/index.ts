// Enums matching backend definitions (UPPER_SNAKE_CASE)

export enum CaseStatus {
  INITIAL = "INITIAL",
  IN_PROGRESS = "IN_PROGRESS",
  EVIDENCE_STAGE = "EVIDENCE_STAGE",
  CLOSING_ARGUMENTS = "CLOSING_ARGUMENTS",
  AWAITING_JUDGMENT = "AWAITING_JUDGMENT",
  JUDGMENT_ISSUED = "JUDGMENT_ISSUED",
  IN_EXECUTION = "IN_EXECUTION",
  ARCHIVED = "ARCHIVED",
  SUSPENDED = "SUSPENDED",
  IN_MEDIATION = "IN_MEDIATION",
}

export enum MatterStatus {
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED",
}

export enum PartyRole {
  PLAINTIFF = "PLAINTIFF",
  DEFENDANT = "DEFENDANT",
  ATTORNEY = "ATTORNEY",
  PROCESS_SERVER = "PROCESS_SERVER",
  EXPERT_WITNESS = "EXPERT_WITNESS",
  WITNESS = "WITNESS",
  JUDGE = "JUDGE",
  CLERK = "CLERK",
  CLIENT = "CLIENT",
  OPPOSING_PARTY = "OPPOSING_PARTY",
}

export enum JurisdictionType {
  CIVIL_COMMERCIAL = "CIVIL_COMMERCIAL",
  LABOR = "LABOR",
  CRIMINAL = "CRIMINAL",
  FAMILY = "FAMILY",
  ADMINISTRATIVE = "ADMINISTRATIVE",
  COLLECTIONS = "COLLECTIONS",
  PROBATE = "PROBATE",
  EXTRAJUDICIAL = "EXTRAJUDICIAL",
}

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

// Interfaces

export interface User {
  id: string;
  email: string;
  firmId: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Case {
  id: string;
  firmId: string;
  caseTitle: string;
  caseNumber: string;
  courtId: string | null;
  jurisdictionType: JurisdictionType;
  status: CaseStatus;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface Matter {
  id: string;
  firmId: string;
  title: string;
  description: string | null;
  status: MatterStatus;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  firmId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface Movement {
  id: string;
  firmId: string;
  caseId: string | null;
  matterId: string | null;
  title: string;
  description: string | null;
  occurredAt: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  firmId: string;
  caseId: string | null;
  matterId: string | null;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  isDeadline: boolean;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

// API response types

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
