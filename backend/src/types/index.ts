// Domain enums mapped from the Argentine legal glossary

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

// Standard API response types

export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

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

// Audit fields present on every data table
export interface AuditFields {
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

// Authenticated user attached to request by auth middleware
export interface AuthenticatedUser {
  id: string;
  firmId: string;
  role: UserRole;
  email: string;
}
