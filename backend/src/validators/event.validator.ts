import { z } from "zod/v4";
import { eventType, eventStatus } from "../models/enums";

const eventTypeValues = Object.values(eventType) as [string, ...string[]];
const eventStatusValues = Object.values(eventStatus) as [string, ...string[]];

export const createEventSchema = z.object({
  caseId: z.string().nullish(),
  matterId: z.string().nullish(),
  eventType: z.enum(eventTypeValues, { error: "Tipo de evento inválido" }),
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().nullish(),
  eventDate: z.coerce.date({ error: "Fecha inválida" }),
  eventTime: z.string().nullish(),
  endDate: z.coerce.date().nullish(),
  endTime: z.string().nullish(),
  isAllDay: z.boolean().default(false),
  assignedToId: z.string().nullish(),
  status: z.enum(eventStatusValues, { error: "Estado inválido" }).default("PENDING"),
  reminderMinutesBefore: z.number().int().min(0).nullish(),
});

export const updateEventSchema = z.object({
  eventType: z.enum(eventTypeValues, { error: "Tipo de evento inválido" }).optional(),
  title: z.string().min(1, "El título es obligatorio").optional(),
  description: z.string().nullish(),
  eventDate: z.coerce.date({ error: "Fecha inválida" }).optional(),
  eventTime: z.string().nullish(),
  endDate: z.coerce.date().nullish(),
  endTime: z.string().nullish(),
  isAllDay: z.boolean().optional(),
  assignedToId: z.string().nullish(),
  status: z.enum(eventStatusValues, { error: "Estado inválido" }).optional(),
  reminderMinutesBefore: z.number().int().min(0).nullish(),
});

export const queryEventSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  caseId: z.string().optional(),
  matterId: z.string().optional(),
  eventType: z.enum(eventTypeValues).optional(),
  status: z.enum(eventStatusValues).optional(),
  sort: z.enum(["event_date", "created_at", "title"]).default("event_date"),
  order: z.enum(["asc", "desc"]).default("asc"),
});
