// Portal scraper service — runs server-side only.
// Periodically queries judicial portals with encrypted user credentials,
// compares results with app data, and creates movements + notifications
// when new activity is detected.

// TODO: Implement scraper for MEV (mev.scba.gov.ar) — Provincia de Buenos Aires
// TODO: Implement scraper for Portal del SAE (portaldelsae.justucuman.gov.ar) — Tucumán

export class PortalScraperService {
  // Scrape a specific portal for a given case
  async scrapeCase(
    portal: "MEV" | "SAE",
    caseNumber: string,
    credentials: { username: string; password: string }
  ): Promise<unknown[]> {
    throw new Error("PortalScraperService.scrapeCase not implemented");
  }

  // Run periodic check for all tracked cases of a firm
  async runPeriodicCheck(firmId: string): Promise<void> {
    throw new Error(
      "PortalScraperService.runPeriodicCheck not implemented"
    );
  }
}

export const portalScraperService = new PortalScraperService();
