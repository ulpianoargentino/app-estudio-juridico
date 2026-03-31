import { useState } from "react";
import { es } from "@/i18n/es";
import { useErrandsReport } from "@/hooks/use-reports";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ErrandRow } from "@/services/report.service";

const ERRAND_TYPE_OPTIONS = Object.entries(es.errandTypes);
const ERRAND_STATUS_OPTIONS = Object.entries(es.errandStatuses);

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
}

export function ErrandsReport() {
  const [errandType, setErrandType] = useState<string>("all");
  const [responsibleId, setResponsibleId] = useState("");
  const [status, setStatus] = useState<string>("all");

  const { data, isLoading } = useErrandsReport({
    errandType: errandType !== "all" ? errandType : undefined,
    responsibleId: responsibleId || undefined,
    status: status !== "all" ? status : undefined,
  });

  const errands = data ?? [];

  const columns: ColumnDef<ErrandRow>[] = [
    {
      key: "errandType",
      header: es.reports.errandType,
      render: (r) => es.errandTypes[r.errandType as keyof typeof es.errandTypes] ?? r.errandType,
    },
    {
      key: "case",
      header: es.reports.casesTab,
      render: (r) => r.caseCaseTitle ? (
        <span className="text-sm">
          {r.caseCaseNumber ? `${r.caseCaseNumber} — ` : ""}
          {r.caseCaseTitle}
        </span>
      ) : "—",
    },
    {
      key: "responsibleName",
      header: es.reports.responsible,
      className: "hidden md:table-cell",
      render: (r) => r.responsibleName || "—",
    },
    {
      key: "dueDate",
      header: es.reports.dueDate,
      className: "hidden sm:table-cell",
      render: (r) => formatDate(r.dueDate),
    },
    {
      key: "status",
      header: es.reports.status,
      render: (r) => (
        <StatusBadge
          status={r.status}
          label={es.errandStatuses[r.status as keyof typeof es.errandStatuses] ?? r.status}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4 pt-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">{es.reports.errandType}</Label>
          <Select value={errandType} onValueChange={setErrandType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={es.reports.allTypes} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{es.reports.allTypes}</SelectItem>
              {ERRAND_TYPE_OPTIONS.map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{es.reports.responsible}</Label>
          <Input
            value={responsibleId}
            onChange={(e) => setResponsibleId(e.target.value)}
            placeholder={es.reports.allResponsibles}
            className="w-48"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{es.reports.status}</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={es.reports.allErrandStatuses} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{es.reports.allErrandStatuses}</SelectItem>
              {ERRAND_STATUS_OPTIONS.map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <DataTable<ErrandRow>
          columns={columns}
          data={errands}
          isLoading={isLoading}
          emptyMessage={es.reports.noErrands}
        />
      </div>
    </div>
  );
}
