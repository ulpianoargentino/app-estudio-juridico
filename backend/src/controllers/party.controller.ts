import { Request, Response, NextFunction } from "express";
import { z } from "zod/v4";
import * as partyService from "../services/party.service";
import { addPartySchema } from "../validators/party.validator";

function formatZodError(error: z.ZodError) {
  return {
    code: "VALIDATION_ERROR",
    message: "Datos de entrada inválidos",
    details: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
  };
}

// Cases
export async function addPartyToCase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = addPartySchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const party = await partyService.addParty(req.firmId!, {
      ...parsed.data, caseId: req.params.caseId as string,
    }, req.user!.userId);
    res.status(201).json({ data: party });
  } catch (err) { next(err); }
}

export async function removePartyFromCase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await partyService.removeParty(req.firmId!, req.params.partyId as string);
    res.json({ data: { message: "Parte eliminada" } });
  } catch (err) { next(err); }
}

export async function listPartiesOfCase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await partyService.getPartiesByCase(req.firmId!, req.params.caseId as string);
    res.json({ data });
  } catch (err) { next(err); }
}

// Matters
export async function addPartyToMatter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = addPartySchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }
    const party = await partyService.addParty(req.firmId!, {
      ...parsed.data, matterId: req.params.matterId as string,
    }, req.user!.userId);
    res.status(201).json({ data: party });
  } catch (err) { next(err); }
}

export async function removePartyFromMatter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await partyService.removeParty(req.firmId!, req.params.partyId as string);
    res.json({ data: { message: "Parte eliminada" } });
  } catch (err) { next(err); }
}

export async function listPartiesOfMatter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await partyService.getPartiesByMatter(req.firmId!, req.params.matterId as string);
    res.json({ data });
  } catch (err) { next(err); }
}
