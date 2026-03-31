// Portal del SAE (portaldelsae.justucuman.gov.ar)
// Tucumán
//
// MOCK implementation. When real endpoints are discovered via network
// traffic inspection, replace the body of fetchCaseMovements and
// testCredentials with actual HTTP requests. The interface stays the same.

import { portal } from "../../models/enums";
import type { PortalAdapter, PortalCredentials, PortalMovement } from "../portal-interface";

export const saePortal: PortalAdapter = {
  portal: portal.SAE_TUCUMAN,

  async fetchCaseMovements(
    _credentials: PortalCredentials,
    caseNumber: string
  ): Promise<PortalMovement[]> {
    // TODO: Replace with real HTTP requests to portaldelsae.justucuman.gov.ar
    // Steps will likely be:
    // 1. POST login with credentials
    // 2. Search by case number
    // 3. Parse response to extract movements

    return [
      {
        date: new Date("2026-03-27T16:00:00Z"),
        description: `[MOCK SAE] Auto interlocutorio. Expediente ${caseNumber}`,
      },
      {
        date: new Date("2026-03-24T09:00:00Z"),
        description: `[MOCK SAE] Decreto de mero trámite. Expediente ${caseNumber}`,
      },
    ];
  },

  async testCredentials(_credentials: PortalCredentials): Promise<boolean> {
    // TODO: Replace with actual login attempt to portaldelsae.justucuman.gov.ar
    return true;
  },
};
