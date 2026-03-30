import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCases, useDeleteCase, useFirmUsers } from "@/hooks/use-cases";
import { es } from "@/i18n/es";
import { CaseStatus, JurisdictionType } from "@/types";
import { ApiError } from "@/services/api";
import type { CaseSummary } from "@/services/case.service";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";

export function CasesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>("all");
  const [attorneyFilter, setAttorneyFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<CaseSummary | null>(null);

  const filters = {
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    jurisdictionType: jurisdictionFilter !== "all" ? jurisdictionFilter : undefined,
    assignedAttorneyId: attorneyFilter !== "all" ? attorneyFilter : undefined,
    sort: "updated_at",
    order: "desc" as const,
  };

  const { data, isLoading } = useCases(filters);
  const { data: firmUsers } = useFirmUsers();
  const deleteMutation = useDeleteCase();

  const cases = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  function handleDelete(c: CaseSummary, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleteTarget(c);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(es.cases.deleted);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    }
    setDeleteTarget(null);
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  const columns: ColumnDef<CaseSummary>[] = [
    {
      key: "caseNumber",
      header: es.cases.caseNumber,
      sortable: true,
      className: "whitespace-nowrap",
      render: (c) => <span className="font-medium">{c.caseNumber}</span>,
    },
    {
      key: "caseTitle",
      header: es.cases.caseTitle,
      sortable: true,
      render: (c) => <span className="truncate max-w-[300px] block">{c.caseTitle}</span>,
    },
    {
      key: "jurisdictionType",
      header: es.cases.jurisdictionType,
      className: "hidden md:table-cell",
      render: (c) => (
        <span className="text-xs text-muted-foreground">
          {es.jurisdictionTypes[c.jurisdictionType]}
        </span>
      ),
    },
    {
      key: "status",
      header: es.cases.status,
      render: (c) => <StatusBadge status={c.status} />,
    },
    {
      key: "assignedAttorneyName",
      header: es.cases.assignedAttorney,
      className: "hidden lg:table-cell",
      render: (c) => c.assignedAttorneyName || "—",
    },
    {
      key: "updatedAt",
      header: es.cases.lastUpdate,
      className: "hidden lg:table-cell whitespace-nowrap",
      render: (c) => formatDate(c.updatedAt),
    },
    {
      key: "actions",
      header: es.common.actions,
      className: "w-[100px] text-right",
      render: (c) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigate(`/cases/${c.id}`); }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigate(`/cases/${c.id}/edit`); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => handleDelete(c, e)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={es.cases.title}
        action={
          <Button onClick={() => navigate("/cases/new")}>
            <Plus className="h-4 w-4" />
            {es.cases.new}
          </Button>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap pb-4">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder={es.cases.searchPlaceholder}
          className="sm:w-80"
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={es.cases.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{es.cases.allStatuses}</SelectItem>
            {Object.values(CaseStatus).map((s) => (
              <SelectItem key={s} value={s}>{es.caseStatuses[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={jurisdictionFilter} onValueChange={(v) => { setJurisdictionFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={es.cases.jurisdictionType} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{es.cases.allJurisdictions}</SelectItem>
            {Object.values(JurisdictionType).map((j) => (
              <SelectItem key={j} value={j}>{es.jurisdictionTypes[j]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={attorneyFilter} onValueChange={(v) => { setAttorneyFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={es.cases.assignedAttorney} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{es.cases.allAttorneys}</SelectItem>
            {(firmUsers ?? []).map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.lastName}, {u.firstName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <DataTable<CaseSummary>
          columns={columns}
          data={cases}
          isLoading={isLoading}
          onRowClick={(row) => navigate(`/cases/${row.id}`)}
        />
      </div>

      <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        title={es.cases.deleteConfirmTitle}
        description={es.cases.deleteConfirmDescription}
        confirmText={es.common.delete}
        variant="danger"
      />
    </div>
  );
}
