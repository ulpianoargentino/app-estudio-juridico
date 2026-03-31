import { useState } from "react";
import { es } from "@/i18n/es";
import { useDeadlinesReport } from "@/hooks/use-reports";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { DeadlineRow } from "@/services/report.service";

const DAY_OPTIONS = [
  { value: 7, label: es.reports.next7Days },
  { value: 15, label: es.reports.next15Days },
  { value: 30, label: es.reports.next30Days },
];

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
}

function isWithinDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
}

export function DeadlinesReport() {
  const [days, setDays] = useState(7);
  const [assignedToId, setAssignedToId] = useState("");

  const { data, isLoading } = useDeadlinesReport({
    days,
    assignedToId: assignedToId || undefined,
  });

  const deadlines = data ?? [];

  return (
    <div className="space-y-4 pt-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex gap-1">
          {DAY_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={days === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{es.reports.assignedTo}</Label>
          <Input
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            placeholder={es.reports.allAssignees}
            className="w-48"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">{es.common.loading}</div>
      ) : deadlines.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">{es.reports.noDeadlines}</div>
      ) : (
        <div className="space-y-2">
          {deadlines.map((d) => (
            <DeadlineCard key={d.id} deadline={d} />
          ))}
        </div>
      )}
    </div>
  );
}

function DeadlineCard({ deadline }: { deadline: DeadlineRow }) {
  const now = new Date();
  const eventDate = new Date(deadline.eventDate);
  const diffDays = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  const isOverdue = deadline.isOverdue;
  const isDueSoon = !isOverdue && diffDays >= 0 && diffDays <= 3;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border p-3 transition-colors",
        isOverdue && "border-red-500/50 bg-red-500/5",
        isDueSoon && !isOverdue && "border-orange-500/50 bg-orange-500/5"
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-medium",
            isOverdue && "text-red-700 dark:text-red-400",
            isDueSoon && !isOverdue && "text-orange-700 dark:text-orange-400"
          )}>
            {formatDate(deadline.eventDate)}
          </span>
          {isOverdue && (
            <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
              {es.reports.overdue}
            </span>
          )}
          {isDueSoon && !isOverdue && (
            <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400">
              {es.reports.dueSoon}
            </span>
          )}
        </div>
        <p className="font-medium">{deadline.title}</p>
        {deadline.linkedName && (
          <p className="text-sm text-muted-foreground">
            {deadline.linkedNumber ? `${deadline.linkedNumber} — ` : ""}
            {deadline.linkedName}
          </p>
        )}
        {deadline.assignedToName && (
          <p className="text-xs text-muted-foreground">
            {es.reports.assignedTo}: {deadline.assignedToName}
          </p>
        )}
      </div>
      <StatusBadge status={deadline.status} />
    </div>
  );
}
