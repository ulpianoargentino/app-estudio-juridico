// Re-export de tipos inferidos desde los schemas. Cualquiera de los dos imports
// funciona:
//   import type { Case } from "@shared/types";
//   import type { Case } from "@shared";
// Este módulo existe para quienes prefieren importar "solo los tipos" sin
// cargar los schemas de valor.

export type {
  AuditFields,
  PaginationMeta,
  ErrorResponse,
} from "../schemas/common";

export type {
  UserRole,
  PersonType,
  CaseStatus,
  JurisdictionType,
  MatterType,
  MatterStatus,
  PartyRole,
  ErrandType,
  ErrandStatus,
  EventType,
  EventStatus,
  DocumentCategory,
  NotificationType,
  CaseLinkType,
  Portal,
} from "../schemas/enums";

export type { Firm, FirmSummary } from "../schemas/firm";
export type { User, AuthUser } from "../schemas/user";
export type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  LogoutResponse,
} from "../schemas/auth";

export type {
  Person,
  PersonCreateInput,
  PersonUpdateInput,
  PersonQuery,
  PersonDetail,
  PersonSearchResult,
} from "../schemas/person";

export type {
  Court,
  CourtCreateInput,
  CourtUpdateInput,
  CourtQuery,
} from "../schemas/court";

export type {
  Case,
  CaseCreateInput,
  CaseUpdateInput,
  CaseQuery,
  CaseListItem,
  CaseDetail,
  CaseSummary,
} from "../schemas/case";

export type {
  Matter,
  MatterCreateInput,
  MatterUpdateInput,
  MatterQuery,
  MatterListItem,
  MatterDetail,
  MatterConvertToCaseInput,
} from "../schemas/matter";

export type {
  Party,
  PartyCreateInput,
  PartyListItem,
} from "../schemas/party";
