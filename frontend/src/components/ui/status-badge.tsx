import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "danger" | "neutral" | "info" | "default";

// Mapeo de status del dominio a variantes visuales
const statusVariantMap: Record<string, BadgeVariant> = {
  // Case statuses
  INITIAL: "default",
  IN_PROGRESS: "info",
  EVIDENCE_STAGE: "warning",
  CLOSING_ARGUMENTS: "warning",
  AWAITING_JUDGMENT: "warning",
  JUDGMENT_ISSUED: "success",
  IN_EXECUTION: "info",
  ARCHIVED: "neutral",
  SUSPENDED: "neutral",
  IN_MEDIATION: "info",
  // Matter statuses
  ACTIVE: "info",
  ON_HOLD: "default",
  COMPLETED: "success",
  // Event statuses
  PENDING: "default",
  CANCELLED: "neutral",
  // Errand statuses
  FAILED: "danger",
};

// Mapeo de status a texto en español
const statusLabelMap: Record<string, string> = {
  INITIAL: "Inicio",
  IN_PROGRESS: "En trámite",
  EVIDENCE_STAGE: "En prueba",
  CLOSING_ARGUMENTS: "Alegatos",
  AWAITING_JUDGMENT: "Para sentencia",
  JUDGMENT_ISSUED: "Sentencia",
  IN_EXECUTION: "En ejecución",
  ARCHIVED: "Archivado",
  SUSPENDED: "Paralizado",
  IN_MEDIATION: "Mediación",
  ACTIVE: "Activo",
  ON_HOLD: "En espera",
  COMPLETED: "Finalizado",
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
