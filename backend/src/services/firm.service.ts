import { eq } from "drizzle-orm";
import { db } from "../db";
import { firms } from "../models";
import { AppError } from "../middleware/error-handler";

interface FirmResponse {
  id: string;
  name: string;
  logoUrl: string | null;
  accentColor: string | null;
}

export async function getFirm(firmId: string): Promise<FirmResponse> {
  const [firm] = await db
    .select({
      id: firms.id,
      name: firms.name,
      logoUrl: firms.logoUrl,
      accentColor: firms.accentColor,
    })
    .from(firms)
    .where(eq(firms.id, firmId))
    .limit(1);

  if (!firm) {
    throw new AppError(404, "FIRM_NOT_FOUND", "Estudio no encontrado");
  }

  return firm;
}

interface UpdateFirmData {
  name?: string;
  logoUrl?: string | null;
  accentColor?: string | null;
}

export async function updateFirm(
  firmId: string,
  data: UpdateFirmData
): Promise<FirmResponse> {
  const [existing] = await db
    .select({ id: firms.id })
    .from(firms)
    .where(eq(firms.id, firmId))
    .limit(1);

  if (!existing) {
    throw new AppError(404, "FIRM_NOT_FOUND", "Estudio no encontrado");
  }

  const [updated] = await db
    .update(firms)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(firms.id, firmId))
    .returning();

  return {
    id: updated!.id,
    name: updated!.name,
    logoUrl: updated!.logoUrl,
    accentColor: updated!.accentColor,
  };
}
