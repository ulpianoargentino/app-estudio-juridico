import { z } from "zod/v4";
import { documentCategory } from "../models/enums";

const categoryValues = Object.values(documentCategory) as [string, ...string[]];

export const uploadDocumentSchema = z.object({
  category: z.enum(categoryValues),
  movementId: z.string().optional(),
  notes: z.string().optional(),
});
