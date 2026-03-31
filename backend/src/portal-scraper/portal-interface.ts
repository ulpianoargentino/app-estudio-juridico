import type { Portal } from "../models/enums";

// Raw movement data as scraped from a judicial portal
export interface PortalMovement {
  date: Date;
  description: string;
  volume?: string;
  folio?: number;
  documentUrl?: string;
}

// Result of scraping a single case from a portal
export interface PortalCaseResult {
  caseNumber: string;
  movements: PortalMovement[];
}

// Result of a full portal sync for one credential
export interface PortalSyncResult {
  portal: Portal;
  credentialId: string;
  success: boolean;
  casesScraped: number;
  newMovementsFound: number;
  error?: string;
}

// Decrypted credentials passed to the scraper
export interface PortalCredentials {
  username: string;
  password: string;
}

// Each portal implementation must conform to this interface.
// When real endpoints are discovered, only the implementation changes.
export interface PortalAdapter {
  readonly portal: Portal;

  // Fetch movements for a specific case number from the portal
  fetchCaseMovements(
    credentials: PortalCredentials,
    caseNumber: string
  ): Promise<PortalMovement[]>;

  // Test that the credentials are valid (e.g. attempt login)
  testCredentials(credentials: PortalCredentials): Promise<boolean>;
}
