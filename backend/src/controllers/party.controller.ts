import { Request, Response, NextFunction } from "express";
import * as partyService from "../services/party.service";
import { addPartySchema } from "../validators/party.validator";
import { formatZodError } from "../utils/format-validation-error";

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
