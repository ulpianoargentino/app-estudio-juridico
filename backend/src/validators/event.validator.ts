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
  eventDate: z.coerce.date({ error: "Fecha de evento inválida" }),
  eventTime: z.string().nullish(),
  endDate: z.coerce.date().nullish(),
  endTime: z.string().nullish(),
  isAllDay: z.boolean().default(false),
  assignedToId: z.string().nullish(),
  status: z.enum(eventStatusValues, { error: "Estado inválido" }).default("PENDING"),
  reminderMinutesBefore: z.coerce.number().int().min(0).default(60),
});

export const updateEventSchema = z.object({
  caseId: z.string().nullish(),
  matterId: z.string().nullish(),
  eventType: z.enum(eventTypeValues, { error: "Tipo de evento inválido" }).optional(),
  title: z.string().min(1, "El título es obligatorio").optional(),
  description: z.string().nullish(),
  eventDate: z.coerce.date({ error: "Fecha de evento inválida" }).optional(),
  eventTime: z.string().nullish(),
  endDate: z.coerce.date().nullish(),
  endTime: z.string().nullish(),
  isAllDay: z.boolean().optional(),
  assignedToId: z.string().nullish(),
  status: z.enum(eventStatusValues, { error: "Estado inválido" }).optional(),
  reminderMinutesBefore: z.coerce.number().int().min(0).optional(),
});

export const queryEventSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  eventType: z.enum(eventTypeValues).optional(),
  assignedToId: z.string().optional(),
  status: z.enum(eventStatusValues).optional(),
  caseId: z.string().optional(),
  matterId: z.string().optional(),
  sort: z.enum(["event_date", "created_at"]).default("event_date"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const upcomingEventSchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
});
