import { useState } from "react";
import { es } from "@/i18n/es";
import { useCasesReport } from "@/hooks/use-reports";
import { downloadCasesExport, type CasesReportFilters } from "@/services/report.service";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Download, Filter, X } from "lucide-react";
import type { CaseReportRow } from "@/services/report.service";

const CASE_STATUS_OPTIONS = Object.entries(es.caseStatuses);
const JURISDICTION_OPTIONS = Object.entries(es.jurisdictionTypes);

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
}

export function CasesReport() {
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([]);
  const [responsibleAttorneyId, setResponsibleAttorneyId] = useState("");
  const [startDateFrom, setStartDateFrom] = useState("");
  const [startDateTo, setStartDateTo] = useState("");
  const [claimedAmountMin, setClaimedAmountMin] = useState("");
  const [claimedAmountMax, setClaimedAmountMax] = useState("");

  // Applied filters (only update when "Apply" is clicked)
  const [appliedFilters, setAppliedFilters] = useState<CasesReportFilters>({});
  const [exporting, setExporting] = useState(false);

  const filters: CasesReportFilters = {
    page,
    limit: 20,
    sort: "updated_at",
    order: "desc",
    ...appliedFilters,
  };

  const { data, isLoading } = useCasesReport(filters);
  const rows = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  function applyFilters() {
    const f: CasesReportFilters = {};
    if (selectedStatuses.length > 0) f.status = selectedStatuses;
    if (selectedJurisdictions.length > 0) f.jurisdictionType = selectedJurisdictions;
    if (responsibleAttorneyId) f.responsibleAttorneyId = responsibleAttorneyId;
    if (startDateFrom) f.startDateFrom = startDateFrom;
    if (startDateTo) f.startDateTo = startDateTo;
    if (claimedAmountMin) f.claimedAmountMin = Number(claimedAmountMin);
    if (claimedAmountMax) f.claimedAmountMax = Number(claimedAmountMax);
    setAppliedFilters(f);
    setPage(1);
  }

  function clearFilters() {
    setSelectedStatuses([]);
    setSelectedJurisdictions([]);
    setResponsibleAttorneyId("");
    setStartDateFrom("");
    setStartDateTo("");
    setClaimedAmountMin("");
    setClaimedAmountMax("");
    setAppliedFilters({});
    setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    try {
      await downloadCasesExport({ ...appliedFilters, sort: "updated_at", order: "desc" });
    } finally {
      setExporting(false);
    }
  }

  function toggleMulti(arr: string[], value: string, setter: (v: string[]) => void) {
    if (arr.includes(value)) {
      setter(arr.filter((v) => v !== value));
    } else {
      setter([...arr, value]);
    }
  }

  const columns: ColumnDef<CaseReportRow>[] = [
    { key: "caseNumber", header: es.reports.caseNumber, render: (r) => r.caseNumber || "—" },
    { key: "caseTitle", header: es.reports.caseTitle, render: (r) => <span className="font-medium">{r.caseTitle}</span> },
    {
      key: "jurisdictionType",
      header: es.reports.jurisdictionType,
      className: "hidden md:table-cell",
      render: (r) => es.jurisdictionTypes[r.jurisdictionType as keyof typeof es.jurisdictionTypes] ?? r.jurisdictionType,
    },
    {
      key: "status",
      header: es.reports.status,
      render: (r) => <StatusBadge status={r.status} />,
    },
    { key: "courtName", header: es.reports.court, className: "hidden lg:table-cell", render: (r) => r.courtName || "—" },
    { key: "responsibleAttorneyName", header: es.reports.attorney, className: "hidden lg:table-cell", render: (r) => r.responsibleAttorneyName || "—" },
    { key: "startDate", header: es.reports.startDate, className: "hidden md:table-cell", render: (r) => formatDate(r.startDate) },
    {
      key: "claimedAmount",
      header: es.reports.claimedAmount,
      className: "hidden lg:table-cell text-right",
      render: (r) => r.claimedAmount ? `${r.currency ?? "$"} ${Number(r.claimedAmount).toLocaleString("es-AR")}` : "—",
    },
    { key: "updatedAt", header: es.reports.lastUpdated, className: "hidden xl:table-cell", render: (r) => formatDate(r.updatedAt) },
  ];

  return (
    <div className="space-y-4 pt-4">
      {/* Filter toggle + export */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={() => setFiltersOpen(!filtersOpen)}>
          <Filter className="mr-1 h-4 w-4" />
          {filtersOpen ? es.reports.hideFilters : es.reports.showFilters}
          {filtersOpen ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
          <Download className="mr-1 h-4 w-4" />
          {es.reports.exportCsv}
        </Button>
      </div>

      {/* Collapsible filter panel */}
      {filtersOpen && (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Status multi-select */}
            <div className="space-y-1.5">
              <Label>{es.reports.status}</Label>
              <div className="flex flex-wrap gap-1">
                {CASE_STATUS_OPTIONS.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleMulti(selectedStatuses, key, setSelectedStatuses)}
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
                      selectedStatuses.includes(key)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Jurisdiction multi-select */}
            <div className="space-y-1.5">
              <Label>{es.reports.jurisdictionType}</Label>
              <div className="flex flex-wrap gap-1">
                {JURISDICTION_OPTIONS.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleMulti(selectedJurisdictions, key, setSelectedJurisdictions)}
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
                      selectedJurisdictions.includes(key)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Responsible attorney (free text ID for now) */}
            <div className="space-y-1.5">
              <Label>{es.reports.responsibleAttorney}</Label>
              <Input
                value={responsibleAttorneyId}
                onChange={(e) => setResponsibleAttorneyId(e.target.value)}
                placeholder="ID del abogado"
              />
            </div>

            {/* Start date range */}
            <div className="space-y-1.5">
              <Label>{es.reports.startDateFrom}</Label>
              <Input
                type="date"
                value={startDateFrom}
                onChange={(e) => setStartDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{es.reports.startDateTo}</Label>
              <Input
                type="date"
                value={startDateTo}
                onChange={(e) => setStartDateTo(e.target.value)}
              />
            </div>

            {/* Amount range */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>{es.reports.claimedAmountMin}</Label>
                <Input
                  type="number"
                  min={0}
                  value={claimedAmountMin}
                  onChange={(e) => setClaimedAmountMin(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{es.reports.claimedAmountMax}</Label>
                <Input
                  type="number"
                  min={0}
                  value={claimedAmountMax}
                  onChange={(e) => setClaimedAmountMax(e.target.value)}
                  placeholder="999999"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={applyFilters}>
              {es.reports.applyFilters}
            </Button>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-3 w-3" />
              {es.reports.clearFilters}
            </Button>
          </div>
        </div>
      )}

      {/* Results counter */}
      <p className="text-sm text-muted-foreground">
        {es.reports.showing} {rows.length} {es.reports.of} {meta.total} {es.reports.records}
      </p>

      {/* Data table */}
      <div className="rounded-lg border">
        <DataTable<CaseReportRow>
          columns={columns}
          data={rows}
          isLoading={isLoading}
        />
      </div>

      <Pagination
        currentPage={meta.page}
        totalPages={meta.totalPages ?? 1}
        onPageChange={setPage}
      />
    </div>
  );
}
