import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { syncLogs, portalCredentials } from "../models";
import { syncAllPortals, syncPortal } from "../portal-scraper";
import { AppError } from "../middleware/error-handler";
import type { PortalSyncResult } from "../portal-scraper/portal-interface";

// Trigger a full sync for all active credentials in a firm
export async function triggerFullSync(
  firmId: string
): Promise<PortalSyncResult[]> {
  return syncAllPortals(firmId);
}

// Trigger sync for a single credential
export async function triggerCredentialSync(
  firmId: string,
  credentialId: string
): Promise<PortalSyncResult> {
  const [credential] = await db
    .select()
    .from(portalCredentials)
    .where(
      and(
        eq(portalCredentials.id, credentialId),
        eq(portalCredentials.firmId, firmId)
      )
    )
    .limit(1);

  if (!credential) {
    throw new AppError(
      404,
      "CREDENTIAL_NOT_FOUND",
      "Credencial de portal no encontrada"
    );
  }

  if (!credential.isActive) {
    throw new AppError(
      400,
      "CREDENTIAL_INACTIVE",
      "La credencial está desactivada"
    );
  }

  return syncPortal(firmId, credential);
}

// Get sync logs for a firm, optionally filtered by credential
export async function getSyncLogs(
  firmId: string,
  credentialId?: string,
  limit = 20
) {
  const conditions = [eq(syncLogs.firmId, firmId)];
  if (credentialId) {
    conditions.push(eq(syncLogs.credentialId, credentialId));
  }

  return db
    .select()
    .from(syncLogs)
    .where(and(...conditions))
    .orderBy(desc(syncLogs.startedAt))
    .limit(limit);
}
