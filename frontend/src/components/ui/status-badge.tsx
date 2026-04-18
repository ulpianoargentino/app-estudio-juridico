import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "danger" | "neutral" | "info" | "default";

// Mapeo de status del dominio a variantes visuales.
// Los labels visibles se resuelven desde i18n en cada caller (pasar `label`),
// pero mantenemos un fallback hardcoded para status usados sin traducción.
const statusVariantMap: Record<string, BadgeVariant> = {
  // Case statuses (13 valores unificados, sin procedural_stages aparte)
  INITIAL: "info",
  IN_MEDIATION: "info",
  EVIDENCE_STAGE: "warning",
  CLOSING_ARGUMENTS: "warning",
  AWAITING_INTERLOCUTORY: "warning",
  AWAITING_JUDGMENT: "warning",
  JUDGMENT_ISSUED: "success",
  ON_APPEAL: "warning",
  FINAL_JUDGMENT: "success",
  IN_EXECUTION: "info",
  INCIDENT: "warning",
  SUSPENDED: "neutral",
  CLOSED: "neutral",
  // Matter statuses
  ACTIVE: "info",
  ON_HOLD: "default",
  COMPLETED: "success",
  ARCHIVED: "neutral",
  // Event / errand statuses
  PENDING: "default",
  CANCELLED: "neutral",
  FAILED: "danger",
};

// Fallback para cuando el caller no pasa `label`. Los consumidores de dominio
// deberían pasar siempre la traducción explícita (es.cases.status.*, etc.).
const statusLabelMap: Record<string, string> = {
  INITIAL: "Inicio",
  IN_MEDIATION: "Mediación",
  EVIDENCE_STAGE: "Abierto a prueba",
  CLOSING_ARGUMENTS: "Alegatos",
  AWAITING_INTERLOCUTORY: "Para interlocutoria",
  AWAITING_JUDGMENT: "Para sentencia definitiva",
  JUDGMENT_ISSUED: "Sentencia dictada",
  ON_APPEAL: "Apelación",
  FINAL_JUDGMENT: "Sentencia firme",
  IN_EXECUTION: "En ejecución",
  INCIDENT: "Incidente",
  SUSPENDED: "Paralizado",
  CLOSED: "Terminado",
  ACTIVE: "Activo",
  ON_HOLD: "En espera",
  COMPLETED: "Finalizado",
  ARCHIVED: "Archivado",
  PENDING: "Pendiente",
  CANCELLED: "Cancelado",
  FAILED: "Fallido",
};

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  danger: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  default: "bg-secondary text-secondary-foreground border-border",
};

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, variant, label, className }: StatusBadgeProps) {
  const resolvedVariant = variant ?? statusVariantMap[status] ?? "default";
  const resolvedLabel = label ?? statusLabelMap[status] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        variantStyles[resolvedVariant],
        className
      )}
    >
      {resolvedLabel}
    </span>
  );
}
