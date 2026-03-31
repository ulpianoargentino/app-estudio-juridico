import { Request, Response, NextFunction } from "express";
import { z } from "zod/v4";
import { contextualChat, generateFiling, suggestNextSteps, analyzeDocument } from "../ai-service";
import {
  chatSchema,
  generateFilingSchema,
  suggestNextStepsSchema,
  analyzeDocumentSchema,
} from "../validators/ai.validator";

function formatZodError(error: z.ZodError) {
  return {
    code: "VALIDATION_ERROR",
    message: "Datos de entrada inválidos",
    details: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
  };
}

// Rate limiting: per-user, in-memory
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 20;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(userId, recent);
    return false;
  }
  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true;
}

export async function chat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!checkRateLimit(req.user!.userId)) {
      res.status(429).json({
        error: { code: "RATE_LIMIT", message: "Demasiadas solicitudes. Esperá un momento antes de intentar de nuevo." },
      });
      return;
    }

    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const { messages, caseId, matterId } = parsed.data;
    const result = await contextualChat(req.firmId!, messages, caseId, matterId);
    res.json({ data: { response: result.reply } });
  } catch (err) {
    next(err);
  }
}

export async function generateFilingHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!checkRateLimit(req.user!.userId)) {
      res.status(429).json({
        error: { code: "RATE_LIMIT", message: "Demasiadas solicitudes. Esperá un momento antes de intentar de nuevo." },
      });
      return;
    }

    const parsed = generateFilingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const { caseId, filingType, instructions } = parsed.data;
    const result = await generateFiling(req.firmId!, caseId, filingType, instructions);
    res.json({ data: { html: result.html } });
  } catch (err) {
    next(err);
  }
}

export async function suggestNextStepsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!checkRateLimit(req.user!.userId)) {
      res.status(429).json({
        error: { code: "RATE_LIMIT", message: "Demasiadas solicitudes. Esperá un momento antes de intentar de nuevo." },
      });
      return;
    }

    const parsed = suggestNextStepsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const { caseId } = parsed.data;
    const result = await suggestNextSteps(req.firmId!, caseId);
    res.json({ data: { suggestions: result.suggestions } });
  } catch (err) {
    next(err);
  }
}

export async function analyzeDocumentHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!checkRateLimit(req.user!.userId)) {
      res.status(429).json({
        error: { code: "RATE_LIMIT", message: "Demasiadas solicitudes. Esperá un momento antes de intentar de nuevo." },
      });
      return;
    }

    const parsed = analyzeDocumentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const { documentContent, caseId } = parsed.data;
    const result = await analyzeDocument(req.firmId!, documentContent, caseId);
    res.json({ data: { analysis: result.analysis } });
  } catch (err) {
    next(err);
  }
}
