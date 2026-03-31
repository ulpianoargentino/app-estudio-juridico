// MEV — Mesa de Entradas Virtual (mev.scba.gov.ar)
// Provincia de Buenos Aires
//
// MOCK implementation. When real endpoints are discovered via network
// traffic inspection, replace the body of fetchCaseMovements and
// testCredentials with actual HTTP requests. The interface stays the same.

import { portal } from "../../models/enums";
import type { PortalAdapter, PortalCredentials, PortalMovement } from "../portal-interface";

export const mevPortal: PortalAdapter = {
  portal: portal.MEV_BUENOS_AIRES,

  async fetchCaseMovements(
    _credentials: PortalCredentials,
    caseNumber: string
  ): Promise<PortalMovement[]> {
    // TODO: Replace with real HTTP requests to mev.scba.gov.ar
    // Steps will likely be:
    // 1. POST login with credentials (get session cookie)
    // 2. GET/POST search by case number
    // 3. Parse HTML or JSON response to extract movements

    return [
      {
        date: new Date("2026-03-28T14:00:00Z"),
        description: `[MOCK MEV] Proveyendo. Téngase presente. Expediente ${caseNumber}`,
        volume: "Principal",
        folio: 42,
      },
      {
        date: new Date("2026-03-25T10:30:00Z"),
        description: `[MOCK MEV] Se notifica cédula. Expediente ${caseNumber}`,
        volume: "Principal",
        folio: 40,
      },
    ];
  },

  async testCredentials(_credentials: PortalCredentials): Promise<boolean> {
    // TODO: Replace with actual login attempt to mev.scba.gov.ar
    return true;
  },
};
