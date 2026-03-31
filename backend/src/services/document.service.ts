import { eq, and, asc, desc, count } from "drizzle-orm";
import { db } from "../db";
import { documents, users } from "../models";
import { uuidv7 } from "../utils/uuid";
import { AppError } from "../middleware/error-handler";

interface CreateDocumentData {
  caseId?: string | null;
  matterId?: string | null;
  movementId?: string | null;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  category: string;
  notes?: string | null;
}

interface FindAllFilters {
  page: number;
  limit: number;
  caseId?: string;
  matterId?: string;
  category?: string;
  sort: string;
  order: string;
}

const sortColumns = {
  created_at: documents.createdAt,
  file_name: documents.fileName,
  file_size: documents.fileSize,
} as const;

export async function create(firmId: string, data: CreateDocumentData, userId: string) {
  const id = uuidv7();
  const [created] = await db
    .insert(documents)
    .values({
      id,
      firmId,
      caseId: data.caseId ?? null,
      matterId: data.matterId ?? null,
      movementId: data.movementId ?? null,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      category: data.category,
      notes: data.notes ?? null,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return created!;
}

export async function findAll(firmId: string, filters: FindAllFilters) {
  const conditions = [eq(documents.firmId, firmId)];

  if (filters.caseId) conditions.push(eq(documents.caseId, filters.caseId));
  if (filters.matterId) conditions.push(eq(documents.matterId, filters.matterId));
  if (filters.category) conditions.push(eq(documents.category, filters.category));

  const where = and(...conditions);
  const sortCol = sortColumns[filters.sort as keyof typeof sortColumns] ?? documents.createdAt;
  const orderFn = filters.order === "desc" ? desc : asc;
  const offset = (filters.page - 1) * filters.limit;

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: documents.id,
        firmId: documents.firmId,
        caseId: documents.caseId,
        matterId: documents.matterId,
        movementId: documents.movementId,
        fileName: documents.fileName,
        fileUrl: documents.fileUrl,
        fileSize: documents.fileSize,
        mimeType: documents.mimeType,
        category: documents.category,
        notes: documents.notes,
        createdBy: documents.createdBy,
        createdAt: documents.createdAt,
        updatedBy: documents.updatedBy,
        updatedAt: documents.updatedAt,
        uploaderFirstName: users.firstName,
        uploaderLastName: users.lastName,
      })
      .from(documents)
      .leftJoin(users, eq(documents.createdBy, users.id))
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(filters.limit)
      .offset(offset),
    db.select({ count: count() }).from(documents).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  const formatted = data.map((row) => ({
    id: row.id,
    firmId: row.firmId,
    caseId: row.caseId,
    matterId: row.matterId,
    movementId: row.movementId,
    fileName: row.fileName,
    fileUrl: row.fileUrl,
    fileSize: row.fileSize,
    mimeType: row.mimeType,
    category: row.category,
    notes: row.notes,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt,
    uploaderName: row.uploaderFirstName && row.uploaderLastName
      ? `${row.uploaderLastName}, ${row.uploaderFirstName}`
      : null,
  }));

  return {
    data: formatted,
    meta: { total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) },
  };
}

export async function findById(firmId: string, id: string) {
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.firmId, firmId)))
    .limit(1);

  if (!doc) throw new AppError(404, "DOCUMENT_NOT_FOUND", "Documento no encontrado");
  return doc;
}

export async function remove(firmId: string, id: string) {
  const [existing] = await db
    .select({ id: documents.id })
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.firmId, firmId)))
    .limit(1);

  if (!existing) throw new AppError(404, "DOCUMENT_NOT_FOUND", "Documento no encontrado");

  await db.delete(documents).where(and(eq(documents.id, id), eq(documents.firmId, firmId)));
}
