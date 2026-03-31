import { eq, and, ilike, asc, count } from "drizzle-orm";
import { db } from "../db";
import { templates } from "../models";
import { uuidv7 } from "../utils/uuid";
import { AppError } from "../middleware/error-handler";
import { resolveVariables, extractVariableKeys, TEMPLATE_VARIABLES } from "./template-variables";

interface CreateTemplateData {
  name: string;
  category: string;
  content: string;
}

interface FindAllFilters {
  page: number;
  limit: number;
  search?: string;
  category?: string;
}

export async function create(firmId: string, data: CreateTemplateData, userId: string) {
  const id = uuidv7();
  const variables = extractVariableKeys(data.content);

  const [created] = await db
    .insert(templates)
    .values({
      id,
      firmId,
      name: data.name,
      category: data.category,
      content: data.content,
      variables,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return created!;
}

export async function findAll(firmId: string, filters: FindAllFilters) {
  const conditions = [eq(templates.firmId, firmId), eq(templates.isActive, true)];

  if (filters.search) {
    conditions.push(ilike(templates.name, `%${filters.search}%`));
  }
  if (filters.category) {
    conditions.push(eq(templates.category, filters.category));
  }

  const where = and(...conditions);
  const offset = (filters.page - 1) * filters.limit;

  const [data, totalResult] = await Promise.all([
    db
      .select()
      .from(templates)
      .where(where)
      .orderBy(asc(templates.name))
      .limit(filters.limit)
      .offset(offset),
    db.select({ count: count() }).from(templates).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return {
    data,
    meta: { total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) },
  };
}

export async function findById(firmId: string, id: string) {
  const [template] = await db
    .select()
    .from(templates)
    .where(and(eq(templates.id, id), eq(templates.firmId, firmId), eq(templates.isActive, true)))
    .limit(1);

  if (!template) throw new AppError(404, "TEMPLATE_NOT_FOUND", "Plantilla no encontrada");
  return template;
}

export async function update(firmId: string, id: string, data: Partial<CreateTemplateData>, userId: string) {
  const [existing] = await db
    .select({ id: templates.id })
    .from(templates)
    .where(and(eq(templates.id, id), eq(templates.firmId, firmId), eq(templates.isActive, true)))
    .limit(1);
  if (!existing) throw new AppError(404, "TEMPLATE_NOT_FOUND", "Plantilla no encontrada");

  const updateData: Record<string, unknown> = {
    ...data,
    updatedBy: userId,
    updatedAt: new Date(),
  };

  // Re-extract variables if content changed
  if (data.content !== undefined) {
    updateData.variables = extractVariableKeys(data.content);
  }

  const [updated] = await db
    .update(templates)
    .set(updateData)
    .where(and(eq(templates.id, id), eq(templates.firmId, firmId)))
    .returning();

  return updated!;
}

export async function softDelete(firmId: string, id: string, userId: string) {
  const [existing] = await db
    .select({ id: templates.id })
    .from(templates)
    .where(and(eq(templates.id, id), eq(templates.firmId, firmId), eq(templates.isActive, true)))
    .limit(1);
  if (!existing) throw new AppError(404, "TEMPLATE_NOT_FOUND", "Plantilla no encontrada");

  await db
    .update(templates)
    .set({ isActive: false, updatedBy: userId, updatedAt: new Date() })
    .where(and(eq(templates.id, id), eq(templates.firmId, firmId)));
}

export async function renderTemplate(firmId: string, templateId: string, caseId: string, _userId: string) {
  const template = await findById(firmId, templateId);
  const variables = await resolveVariables(firmId, caseId);

  // Replace all {{VARIABLE_NAME}} placeholders with resolved values
  const rendered = template.content.replace(/\{\{(\w+)\}\}/g, (_match: string, key: string) => {
    return variables[key] ?? `{{${key}}}`;
  });

  return { rendered, templateName: template.name, variables };
}

export function getAvailableVariables() {
  return TEMPLATE_VARIABLES;
}
