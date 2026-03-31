import cron from "node-cron";
import { eq, and, gte, lt } from "drizzle-orm";
import { db } from "../db";
import { events, users } from "../models";
import * as notificationService from "../services/notification.service";
import * as emailService from "../services/email.service";

// Runs every day at 8:00 AM Argentina time (UTC-3 = 11:00 UTC)
export function startDeadlineReminderCron() {
  cron.schedule("0 11 * * *", async () => {
    console.log("[cron] Running deadline reminder check...");
    try {
      await checkUpcomingDeadlines();
    } catch (err) {
      console.error("[cron] Deadline reminder error:", err);
    }
  });

  console.log("[cron] Deadline reminder cron scheduled (daily at 8:00 AM ART)");
}

async function checkUpcomingDeadlines() {
  const now = new Date();

  // Start of today in Argentina (UTC-3)
  const todayStart = new Date(now);
  todayStart.setUTCHours(3, 0, 0, 0); // 00:00 ART = 03:00 UTC

  // End of tomorrow in Argentina
  const tomorrowEnd = new Date(todayStart);
  tomorrowEnd.setUTCDate(tomorrowEnd.getUTCDate() + 2);

  // Find DEADLINE events that are PENDING, due today or tomorrow
  const deadlines = await db
    .select({
      id: events.id,
      firmId: events.firmId,
      title: events.title,
      description: events.description,
      eventDate: events.eventDate,
      assignedToId: events.assignedToId,
    })
    .from(events)
    .where(
      and(
        eq(events.eventType, "DEADLINE"),
        eq(events.status, "PENDING"),
        gte(events.eventDate, todayStart),
        lt(events.eventDate, tomorrowEnd),
      )
    );

  console.log(`[cron] Found ${deadlines.length} upcoming deadlines`);

  for (const deadline of deadlines) {
    if (!deadline.assignedToId) continue;

    // Get assigned user
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        firmId: users.firmId,
      })
      .from(users)
      .where(eq(users.id, deadline.assignedToId))
      .limit(1);

    if (!user) continue;

    // Create in-app notification
    await notificationService.create(deadline.firmId, {
      userId: user.id,
      title: "Vencimiento próximo",
      message: `${deadline.title} — ${deadline.eventDate.toLocaleDateString("es-AR")}`,
      notificationType: "DEADLINE_REMINDER",
      referenceType: "event",
      referenceId: deadline.id,
    });

    // Send email
    await emailService.sendDeadlineReminder(
      { email: user.email, firstName: user.firstName },
      {
        title: deadline.title,
        eventDate: deadline.eventDate,
        description: deadline.description,
      },
    );

    console.log(`[cron] Sent deadline reminder to ${user.email} for "${deadline.title}"`);
  }
}
