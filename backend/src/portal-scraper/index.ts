// Portal scraper service.
// Runs server-side (never in the user's browser).
// Periodically queries judicial portals with the user's stored credentials
// and creates movements + notifications when new activity is detected.

// TODO: Implement scraper for MEV (mev.scba.gov.ar) — Provincia de Buenos Aires
// TODO: Implement scraper for Portal del SAE (portaldelsae.justucuman.gov.ar) — Tucumán

// Architecture note: each province has its own portals, jurisdictions, and conventions.
// New provinces should be addable without redesigning the scraper architecture.

export class PortalScraper {
  async scrapePortal(
    portalId: string,
    credentials: { username: string; password: string },
    caseNumber: string
  ): Promise<unknown[]> {
    // TODO: Implement per-portal scraping logic
    throw new Error("Not implemented: scrapePortal");
  }

  async checkForUpdates(firmId: string): Promise<void> {
    // TODO: Compare portal results with existing data,
    // create new movements and send notifications on changes
    throw new Error("Not implemented: checkForUpdates");
  }
}

export const portalScraper = new PortalScraper();
