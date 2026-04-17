import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { parties, persons, cases, matters } from "../models";
import { uuidv7 } from "../utils/uuid";
import { AppError } from "../middleware/error-handler";
import type { PartyCreateInput } from "@shared";

type AddPartyData = PartyCreateInput;

export async function addParty(
  firmId: string,
  data: AddPartyData & { caseId?: string; matterId?: string },
  userId: string
) {
  // Validar que la persona pertenezca al firm
  const [person] = await db.select({ id: persons.id }).from(persons)
    .where(and(eq(persons.id, data.personId), eq(persons.firmId, firmId))).limit(1);
  if (!person) throw new AppError(400, "INVALID_PERSON", "La persona no pertenece a este estudio");

  // Validar que el case o matter pertenezca al firm
  if (data.caseId) {
    const [c] = await db.select({ id: cases.id }).from(cases)
      .where(and(eq(cases.id, data.caseId), eq(cases.firmId, firmId))).limit(1);
    if (!c) throw new AppError(404, "CASE_NOT_FOUND", "Expediente no encontrado");
  }
  if (data.matterId) {
    const [m] = await db.select({ id: matters.id }).from(matters)
      .where(and(eq(matters.id, data.matterId), eq(matters.firmId, firmId))).limit(1);
    if (!m) throw new AppError(404, "MATTER_NOT_FOUND", "Caso no encontrado");
  }

  // Verificar duplicado: misma persona + mismo case/matter + mismo rol
  const dupConditions = [
    eq(parties.firmId, firmId),
    eq(parties.personId, data.personId),
    eq(parties.role, data.role),
  ];
  if (data.caseId) dupConditions.push(eq(parties.caseId, data.caseId));
  if (data.matterId) dupConditions.push(eq(parties.matterId, data.matterId));

  const [dup] = await db.select({ id: parties.id }).from(parties)
    .where(and(...dupConditions)).limit(1);
  if (dup) throw new AppError(409, "PARTY_EXISTS", "Esta persona ya tiene ese rol en este expediente/caso");

  const id = uuidv7();
  const [created] = await db.insert(parties).values({
    id, firmId,
    personId: data.personId,
    caseId: data.caseId ?? null,
    matterId: data.matterId ?? null,
    role: data.role,
    notes: data.notes ?? null,
    createdBy: userId, updatedBy: userId,
  }).returning();

  return created!;
}

export async function removeParty(firmId: string, partyId: string) {
  const [existing] = await db.select({ id: parties.id }).from(parties)
    .where(and(eq(parties.id, partyId), eq(parties.firmId, firmId))).limit(1);
  if (!existing) throw new AppError(404, "PARTY_NOT_FOUND", "Vinculación no encontrada");

  await db.delete(parties).where(and(eq(parties.id, partyId), eq(parties.firmId, firmId)));
}

export async function getPartiesByCase(firmId: string, caseId: string) {
  return db.select({
    id: parties.id, role: parties.role, notes: parties.notes,
    personId: parties.personId,
    firstName: persons.firstName, lastName: persons.lastName,
    businessName: persons.businessName, personType: persons.personType,
    cuitCuil: persons.cuitCuil, email: persons.email,
  }).from(parties)
    .leftJoin(persons, eq(parties.personId, persons.id))
    .where(and(eq(parties.caseId, caseId), eq(parties.firmId, firmId)));
}

export async function getPartiesByMatter(firmId: string, matterId: string) {
  return db.select({
    id: parties.id, role: parties.role, notes: parties.notes,
    personId: parties.personId,
    firstName: persons.firstName, lastName: persons.lastName,
    businessName: persons.businessName, personType: persons.personType,
    cuitCuil: persons.cuitCuil, email: persons.email,
  }).from(parties)
    .leftJoin(persons, eq(parties.personId, persons.id))
    .where(and(eq(parties.matterId, matterId), eq(parties.firmId, firmId)));
}

export async function getPartiesByPerson(firmId: string, personId: string) {
  return db.select({
    id: parties.id, role: parties.role, notes: parties.notes,
    caseId: parties.caseId, matterId: parties.matterId,
    caseTitle: cases.caseTitle, caseNumber: cases.caseNumber,
    matterTitle: matters.title,
  }).from(parties)
    .leftJoin(cases, eq(parties.caseId, cases.id))
    .leftJoin(matters, eq(parties.matterId, matters.id))
    .where(and(eq(parties.personId, personId), eq(parties.firmId, firmId)));
}
