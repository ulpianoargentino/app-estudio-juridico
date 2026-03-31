// Portal scraper orchestrator.
// Runs server-side only. Coordinates syncing judicial portals for a firm,
// comparing scraped movements with existing data, and creating new
// movements + notifications when changes are detected.

import { eq, and } from "drizzle-orm";
import { db } from "../db";
import {
  portalCredentials,
  cases,
  movements,
  notifications,
  syncLogs,
} from "../models";
import type { Portal } from "../models/enums";
import { uuidv7 } from "../utils/uuid";
import { decrypt } from "./encryption";
import { getPortalAdapter } from "./portal-registry";
import type { PortalMovement, PortalSyncResult } from "./portal-interface";

// Sync all active portal credentials for a firm
export async function syncAllPortals(firmId: string): Promise<PortalSyncResult[]> {
  const credentials = await db
    .select()
    .from(portalCredentials)
    .where(
      and(
        eq(portalCredentials.firmId, firmId),
        eq(portalCredentials.isActive, true)
      )
    );

  const results: PortalSyncResult[] = [];
  for (const credential of credentials) {
    const result = await syncPortal(firmId, credential);
    results.push(result);
  }
  return results;
}

// Sync a single portal credential: scrape all linked cases and detect new movements
export async function syncPortal(
  firmId: string,
  credential: typeof portalCredentials.$inferSelect
): Promise<PortalSyncResult> {
  const logId = uuidv7();
  const startedAt = new Date();

  // Create sync log entry
  await db.insert(syncLogs).values({
    id: logId,
    firmId,
    credentialId: credential.id,
    portal: credential.portal,
    startedAt,
  });

  try {
    const adapter = getPortalAdapter(credential.portal as Portal);
    const decryptedCredentials = {
      username: decrypt(credential.usernameEncrypted),
      password: decrypt(credential.passwordEncrypted),
    };

    // Find all active cases in this firm that have a case number (portal-queryable)
    const firmCases = await db
      .select({ id: cases.id, caseNumber: cases.caseNumber })
      .from(cases)
      .where(and(eq(cases.firmId, firmId), eq(cases.isActive, true)));

    const queryableCases = firmCases.filter((c) => c.caseNumber);

    let totalNewMovements = 0;

    for (const caseRow of queryableCases) {
      const portalMovements = await adapter.fetchCaseMovements(
        decryptedCredentials,
        caseRow.caseNumber!
      );

      const newMovements = await detectNewMovements(
        firmId,
        caseRow.id,
        portalMovements
      );

      if (newMovements.length > 0) {
        await insertMovementsAndNotify(firmId, caseRow.id, credential.userId, newMovements);
        totalNewMovements += newMovements.length;
      }
    }

    // Update sync log and credential
    const finishedAt = new Date();
    await Promise.all([
      db
        .update(syncLogs)
        .set({
          finishedAt,
          success: true,
          casesScraped: queryableCases.length,
          newMovementsFound: totalNewMovements,
        })
        .where(eq(syncLogs.id, logId)),
      db
        .update(portalCredentials)
        .set({ lastSyncAt: finishedAt, updatedAt: finishedAt })
        .where(eq(portalCredentials.id, credential.id)),
    ]);

    return {
      portal: credential.portal as Portal,
      credentialId: credential.id,
      success: true,
      casesScraped: queryableCases.length,
      newMovementsFound: totalNewMovements,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await db
      .update(syncLogs)
      .set({
        finishedAt: new Date(),
        success: false,
        errorMessage,
      })
      .where(eq(syncLogs.id, logId));

    return {
      portal: credential.portal as Portal,
      credentialId: credential.id,
      success: false,
      casesScraped: 0,
      newMovementsFound: 0,
      error: errorMessage,
    };
  }
}

// Compare portal movements against existing ones and return only new ones.
// Uses description + date as dedup key (portal movements don't have stable IDs).
async function detectNewMovements(
  firmId: string,
  caseId: string,
  portalMovements: PortalMovement[]
): Promise<PortalMovement[]> {
  const existing = await db
    .select({
      description: movements.description,
      movementDate: movements.movementDate,
    })
    .from(movements)
    .where(and(eq(movements.firmId, firmId), eq(movements.caseId, caseId)));

  const existingKeys = new Set(
    existing.map((m) => `${m.movementDate.toISOString()}|${m.description}`)
  );

  return portalMovements.filter(
    (pm) => !existingKeys.has(`${pm.date.toISOString()}|${pm.description}`)
  );
}

// Insert new movements into the DB and create a notification for the user
async function insertMovementsAndNotify(
  firmId: string,
  caseId: string,
  userId: string,
  newMovements: PortalMovement[]
): Promise<void> {
  const movementValues = newMovements.map((m) => ({
    id: uuidv7(),
    firmId,
    caseId,
    movementDate: m.date,
    movementType: "PORTAL_UPDATE",
    description: m.description,
    volume: m.volume ?? null,
    folio: m.folio ?? null,
    documentUrl: m.documentUrl ?? null,
    createdBy: userId,
    updatedBy: userId,
  }));

  await db.insert(movements).values(movementValues);

  // Single notification summarizing the update
  await db.insert(notifications).values({
    id: uuidv7(),
    firmId,
    userId,
    title: "Novedades en portal judicial",
    message: `Se detectaron ${newMovements.length} nuevo(s) movimiento(s) en el expediente.`,
    notificationType: "PORTAL_UPDATE",
    referenceType: "case",
    referenceId: caseId,
  });
}
