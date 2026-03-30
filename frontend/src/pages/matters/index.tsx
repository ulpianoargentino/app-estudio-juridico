import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMatters, useDeleteMatter } from "@/hooks/use-matters";
import { es } from "@/i18n/es";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { MatterForm } from "./matter-form";
import type { Matter } from "@/services/matter.service";
import { ApiError } from "@/services/api";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";

const matterTypeLabels: Record<string, string> = {
  CONSULTATION: es.matters.type.consultation,
  CONTRACT: es.matters.type.contract,
  NEGOTIATION: es.matters.type.negotiation,
  ADVISORY: es.matters.type.advisory,
  OPINION: es.matters.type.opinion,
  OTHER: es.matters.type.other,
};

export function MattersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editMatter, setEditMatter] = useState<Matter | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Matter | null>(null);

  const filters = {
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    matterType: typeFilter !== "all" ? typeFilter : undefined,
    sort: "updated_at",
    order: "desc" as const,
  };

  const { data, isLoading } = useMatters(filters);
  const deleteMutation = useDeleteMatter();

  const matters = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  function handleEdit(m: Matter, e: React.MouseEvent) {
    e.stopPropagation();
    setEditMatter(m);
    setFormOpen(true);
  }

  function handleDelete(m: Matter, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleteTarget(m);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(es.matters.deleted);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    }
    setDeleteTarget(null);
  }

  function handleNew() {
    setEditMatter(null);
    setFormOpen(true);
  }

  const columns: ColumnDef<Matter>[] = [
    {
      key: "title",
      header: es.matters.matterTitle,
      sortable: true,
      render: (m) => <span className="font-medium">{m.title}</span>,
    },
    {
      key: "primaryClientName",
      header: es.matters.client,
      className: "hidden lg:table-cell",
      render: (m) => m.primaryClientName || "—",
    },
    {
      key: "matterType",
      header: es.matters.matterType,
      className: "hidden md:table-cell",
      render: (m) => (
        <span className="text-xs text-muted-foreground">
          {matterTypeLabels[m.matterType] ?? m.matterType}
        </span>
      ),
    },
    {
      key: "status",
      header: es.matters.status,
      className: "hidden sm:table-cell",
      render: (m) => <StatusBadge status={m.status} />,
    },
    {
      key: "responsibleAttorneyName",
      header: es.matters.responsibleAttorney,
      className: "hidden xl:table-cell",
      render: (m) => m.responsibleAttorneyName || "—",
    },
    {
      key: "updatedAt",
      header: es.common.edit,
      className: "hidden lg:table-cell",
      render: (m) => new Date(m.updatedAt).toLocaleDateString("es-AR"),
    },
    {
      key: "actions",
      header: es.common.actions,
      className: "w-[100px] text-right",
      render: (m) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigate(`/matters/${m.id}`); }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleEdit(m, e)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => handleDelete(m, e)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={es.matters.title}
        action={
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4" />
            {es.matters.new}
          </Button>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center pb-4">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder={es.matters.searchPlaceholder}
          className="sm:w-80"
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={es.matters.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{es.matters.allStatuses}</SelectItem>
            <SelectItem value="ACTIVE">{es.matters.statusLabel.active}</SelectItem>
            <SelectItem value="ON_HOLD">{es.matters.statusLabel.onHold}</SelectItem>
            <SelectItem value="COMPLETED">{es.matters.statusLabel.completed}</SelectItem>
            <SelectItem value="ARCHIVED">{es.matters.statusLabel.archived}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={es.matters.matterType} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{es.matters.allTypes}</SelectItem>
            <SelectItem value="CONSULTATION">{es.matters.type.consultation}</SelectItem>
            <SelectItem value="CONTRACT">{es.matters.type.contract}</SelectItem>
            <SelectItem value="NEGOTIATION">{es.matters.type.negotiation}</SelectItem>
            <SelectItem value="ADVISORY">{es.matters.type.advisory}</SelectItem>
            <SelectItem value="OPINION">{es.matters.type.opinion}</SelectItem>
            <SelectItem value="OTHER">{es.matters.type.other}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <DataTable<Matter>
          columns={columns}
          data={matters}
          isLoading={isLoading}
          onRowClick={(row) => navigate(`/matters/${row.id}`)}
        />
      </div>

      <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />

      <MatterForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditMatter(null); }}
        matter={editMatter}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        title={es.matters.deleteConfirmTitle}
        description={es.matters.deleteConfirmDescription}
        confirmText={es.common.delete}
        variant="danger"
      />
    </div>
  );
}
