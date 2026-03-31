import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { portalCredentials } from "../models";
import type { Portal } from "../models/enums";
import { uuidv7 } from "../utils/uuid";
import { encrypt, decrypt } from "../portal-scraper/encryption";
import { getPortalAdapter } from "../portal-scraper/portal-registry";
import { AppError } from "../middleware/error-handler";

interface CreateCredentialData {
  portal: Portal;
  username: string;
  password: string;
}

interface CredentialResponse {
  id: string;
  portal: string;
  username: string;
  isActive: boolean;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Map a DB row to a safe response (never expose encrypted password)
function toResponse(
  row: typeof portalCredentials.$inferSelect
): CredentialResponse {
  return {
    id: row.id,
    portal: row.portal,
    username: decrypt(row.usernameEncrypted),
    isActive: row.isActive,
    lastSyncAt: row.lastSyncAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function create(
  firmId: string,
  userId: string,
  data: CreateCredentialData
): Promise<CredentialResponse> {
  // Test credentials against the portal before saving
  const adapter = getPortalAdapter(data.portal);
  const valid = await adapter.testCredentials({
    username: data.username,
    password: data.password,
  });
  if (!valid) {
    throw new AppError(
      400,
      "INVALID_PORTAL_CREDENTIALS",
      "Las credenciales del portal no son válidas"
    );
  }

  const id = uuidv7();
  const [created] = await db
    .insert(portalCredentials)
    .values({
      id,
      firmId,
      userId,
      portal: data.portal,
      usernameEncrypted: encrypt(data.username),
      passwordEncrypted: encrypt(data.password),
    })
    .returning();

  return toResponse(created!);
}

export async function findAllByFirm(
  firmId: string
): Promise<CredentialResponse[]> {
  const rows = await db
    .select()
    .from(portalCredentials)
    .where(eq(portalCredentials.firmId, firmId))
    .orderBy(desc(portalCredentials.createdAt));

  return rows.map(toResponse);
}

export async function findById(
  firmId: string,
  id: string
): Promise<CredentialResponse> {
  const [row] = await db
    .select()
    .from(portalCredentials)
    .where(
      and(eq(portalCredentials.id, id), eq(portalCredentials.firmId, firmId))
    )
    .limit(1);

  if (!row) {
    throw new AppError(
      404,
      "CREDENTIAL_NOT_FOUND",
      "Credencial de portal no encontrada"
    );
  }

  return toResponse(row);
}

export async function update(
  firmId: string,
  id: string,
  data: Partial<CreateCredentialData>
): Promise<CredentialResponse> {
  const [existing] = await db
    .select()
    .from(portalCredentials)
    .where(
      and(eq(portalCredentials.id, id), eq(portalCredentials.firmId, firmId))
    )
    .limit(1);

  if (!existing) {
    throw new AppError(
      404,
      "CREDENTIAL_NOT_FOUND",
      "Credencial de portal no encontrada"
    );
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (data.username) {
    updates.usernameEncrypted = encrypt(data.username);
  }
  if (data.password) {
    updates.passwordEncrypted = encrypt(data.password);
  }

  // If new credentials provided, test them
  if (data.username || data.password) {
    const username = data.username ?? decrypt(existing.usernameEncrypted);
    const password = data.password ?? decrypt(existing.passwordEncrypted);
    const portalType = (data.portal ?? existing.portal) as Portal;
    const adapter = getPortalAdapter(portalType);
    const valid = await adapter.testCredentials({ username, password });
    if (!valid) {
      throw new AppError(
        400,
        "INVALID_PORTAL_CREDENTIALS",
        "Las credenciales del portal no son válidas"
      );
    }
  }

  if (data.portal) {
    updates.portal = data.portal;
  }

  const [updated] = await db
    .update(portalCredentials)
    .set(updates)
    .where(
      and(eq(portalCredentials.id, id), eq(portalCredentials.firmId, firmId))
    )
    .returning();

  return toResponse(updated!);
}

export async function toggleActive(
  firmId: string,
  id: string,
  isActive: boolean
): Promise<CredentialResponse> {
  const [existing] = await db
    .select()
    .from(portalCredentials)
    .where(
      and(eq(portalCredentials.id, id), eq(portalCredentials.firmId, firmId))
    )
    .limit(1);

  if (!existing) {
    throw new AppError(
      404,
      "CREDENTIAL_NOT_FOUND",
      "Credencial de portal no encontrada"
    );
  }

  const [updated] = await db
    .update(portalCredentials)
    .set({ isActive, updatedAt: new Date() })
    .where(
      and(eq(portalCredentials.id, id), eq(portalCredentials.firmId, firmId))
    )
    .returning();

  return toResponse(updated!);
}

export async function remove(firmId: string, id: string): Promise<void> {
  const [existing] = await db
    .select({ id: portalCredentials.id })
    .from(portalCredentials)
    .where(
      and(eq(portalCredentials.id, id), eq(portalCredentials.firmId, firmId))
    )
    .limit(1);

  if (!existing) {
    throw new AppError(
      404,
      "CREDENTIAL_NOT_FOUND",
      "Credencial de portal no encontrada"
    );
  }

  await db
    .delete(portalCredentials)
    .where(
      and(eq(portalCredentials.id, id), eq(portalCredentials.firmId, firmId))
    );
}
