import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { documents } from "../models";
import { uuidv7 } from "../utils/uuid";
import { storage } from "./storage.service";
import { AppError } from "../middleware/error-handler";
import path from "path";

interface UploadMetadata {
  caseId?: string | null;
  matterId?: string | null;
  movementId?: string | null;
  category: string;
  notes?: string | null;
}

interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export async function upload(
  firmId: string,
  file: UploadedFile,
  metadata: UploadMetadata,
  userId: string
) {
  const id = uuidv7();
  const ext = path.extname(file.originalname);
  const storageName = `${id}${ext}`;

  // Build relative path: {caseId or matterId}/{filename}
  const parentId = metadata.caseId || metadata.matterId || "general";
  const relativePath = path.join(parentId, storageName);

  const fileUrl = await storage.upload(firmId, relativePath, file.buffer);

  const [doc] = await db
    .insert(documents)
    .values({
      id,
      firmId,
      caseId: metadata.caseId ?? null,
      matterId: metadata.matterId ?? null,
      movementId: metadata.movementId ?? null,
      fileName: file.originalname,
      fileUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
      category: metadata.category,
      notes: metadata.notes ?? null,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return doc!;
}

export async function findByCase(firmId: string, caseId: string) {
  return db
    .select()
    .from(documents)
    .where(and(eq(documents.firmId, firmId), eq(documents.caseId, caseId)))
    .orderBy(desc(documents.createdAt));
}

export async function findByMatter(firmId: string, matterId: string) {
  return db
    .select()
    .from(documents)
    .where(and(eq(documents.firmId, firmId), eq(documents.matterId, matterId)))
    .orderBy(desc(documents.createdAt));
}

export async function findByMovement(firmId: string, movementId: string) {
  return db
    .select()
    .from(documents)
    .where(and(eq(documents.firmId, firmId), eq(documents.movementId, movementId)))
    .orderBy(desc(documents.createdAt));
}

export async function getDownloadInfo(firmId: string, id: string) {
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.firmId, firmId)))
    .limit(1);

  if (!doc) {
    throw new AppError(404, "DOCUMENT_NOT_FOUND", "Documento no encontrado");
  }

  const stream = await storage.download(doc.fileUrl);
  return { stream, fileName: doc.fileName, mimeType: doc.mimeType };
}

export async function remove(firmId: string, id: string) {
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.firmId, firmId)))
    .limit(1);

  if (!doc) {
    throw new AppError(404, "DOCUMENT_NOT_FOUND", "Documento no encontrado");
  }

  await storage.delete(doc.fileUrl);

  await db
    .delete(documents)
    .where(and(eq(documents.id, id), eq(documents.firmId, firmId)));
}
