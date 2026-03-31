import { Request, Response, NextFunction } from "express";
import { z } from "zod/v4";
import { contextualChat } from "../ai-service";
import { chatSchema } from "../validators/ai.validator";

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
    // Rate limiting
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

    const result = await contextualChat(
      req.firmId!,
      messages,
      caseId,
      matterId
    );

    res.json({ data: { response: result.reply } });
  } catch (err) {
    next(err);
  }
}
