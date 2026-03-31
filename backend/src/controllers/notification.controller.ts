import { Request, Response, NextFunction } from "express";
import * as notificationService from "../services/notification.service";

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const unreadOnly = req.query.unreadOnly === "true";

    const result = await notificationService.findByUser(
      req.firmId!,
      req.user!.userId,
      {
        isRead: unreadOnly ? false : undefined,
        limit,
        page,
      }
    );

    res.json({ data: result.data, meta: result.meta });
  } catch (err) {
    next(err);
  }
}

export async function countUnread(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await notificationService.countUnread(req.firmId!, req.user!.userId);
    res.json({ data: { count } });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const notification = await notificationService.markAsRead(
      req.firmId!,
      req.params.id as string,
      req.user!.userId,
    );
    res.json({ data: notification });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await notificationService.markAllAsRead(req.firmId!, req.user!.userId);
    res.json({ data: { message: "Todas las notificaciones marcadas como leídas" } });
  } catch (err) {
    next(err);
  }
}
