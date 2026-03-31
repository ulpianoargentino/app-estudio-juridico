import nodemailer from "nodemailer";
import { config } from "../config";

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth:
    config.smtp.user && config.smtp.pass
      ? { user: config.smtp.user, pass: config.smtp.pass }
      : undefined,
});

interface SendEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
}

export async function sendEmail({ to, subject, htmlContent }: SendEmailParams) {
  if (!config.smtp.host) {
    console.warn("SMTP not configured — skipping email send");
    return;
  }

  await transporter.sendMail({
    from: config.smtp.from,
    to,
    subject,
    html: htmlContent,
  });
}

interface DeadlineReminderUser {
  email: string;
  firstName: string;
}

interface DeadlineEvent {
  title: string;
  eventDate: Date;
  description?: string | null;
}

export async function sendDeadlineReminder(user: DeadlineReminderUser, event: DeadlineEvent) {
  const dateStr = event.eventDate.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Recordatorio de vencimiento</h2>
      <p>Hola ${user.firstName},</p>
      <p>Te recordamos que tenés un vencimiento próximo:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px; font-weight: 600;">${event.title}</p>
        <p style="margin: 0 0 8px; color: #666;">Fecha: ${dateStr}</p>
        ${event.description ? `<p style="margin: 0; color: #666;">${event.description}</p>` : ""}
      </div>
      <p style="color: #888; font-size: 12px;">Este es un mensaje automático del sistema de gestión jurídica.</p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: `Recordatorio: ${event.title} — ${dateStr}`,
    htmlContent,
  });
}

interface PortalMovement {
  description: string;
  movementDate?: string;
}

export async function sendPortalUpdate(
  user: DeadlineReminderUser,
  caseName: string,
  movements: PortalMovement[],
) {
  const movementList = movements
    .map(
      (m) =>
        `<li style="margin-bottom: 8px;">
          ${m.movementDate ? `<strong>${m.movementDate}</strong> — ` : ""}${m.description}
        </li>`
    )
    .join("");

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Novedad en expediente</h2>
      <p>Hola ${user.firstName},</p>
      <p>Se detectaron novedades en el expediente <strong>${caseName}</strong>:</p>
      <ul style="background: #f5f5f5; padding: 16px 16px 16px 32px; border-radius: 8px; margin: 16px 0;">
        ${movementList}
      </ul>
      <p style="color: #888; font-size: 12px;">Este es un mensaje automático del sistema de gestión jurídica.</p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: `Novedad en expediente: ${caseName}`,
    htmlContent,
  });
}
