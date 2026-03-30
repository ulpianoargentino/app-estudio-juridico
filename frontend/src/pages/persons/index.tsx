import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { usePersons, useDeletePerson } from "@/hooks/use-persons";
import { es } from "@/i18n/es";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PersonForm } from "./person-form";
import type { Person } from "@/services/person.service";
import { ApiError } from "@/services/api";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";

function personDisplayName(p: Person): string {
  if (p.businessName) return p.businessName;
  return `${p.lastName}, ${p.firstName}`;
}

export function PersonsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [personType, setPersonType] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);

  const filters = {
    page,
    limit: 20,
    search: search || undefined,
    personType: personType !== "all" ? personType : undefined,
    sort: "last_name",
    order: "asc" as const,
  };

  const { data, isLoading } = usePersons(filters);
  const deleteMutation = useDeletePerson();

  const persons = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  function handleEdit(p: Person, e: React.MouseEvent) {
    e.stopPropagation();
    setEditPerson(p);
    setFormOpen(true);
  }

  function handleDelete(p: Person, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleteTarget(p);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(es.person.deleted);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    }
    setDeleteTarget(null);
  }

  function handleNew() {
    setEditPerson(null);
    setFormOpen(true);
  }

  const columns: ColumnDef<Person>[] = [
    {
      key: "name",
      header: es.person.fullName,
      sortable: true,
      render: (p) => (
        <span className="font-medium">{personDisplayName(p)}</span>
      ),
    },
    { key: "cuitCuil", header: es.person.cuit, className: "hidden md:table-cell" },
    { key: "phone", header: es.person.phone, className: "hidden lg:table-cell", render: (p) => p.phone || p.mobilePhone || "—" },
    { key: "email", header: es.person.email, className: "hidden lg:table-cell", render: (p) => p.email || "—" },
    {
      key: "personType",
      header: es.person.type,
      className: "hidden sm:table-cell",
      render: (p) => (
        <span className="text-xs text-muted-foreground">
          {p.personType === "INDIVIDUAL" ? es.person.individual : es.person.legalEntity}
        </span>
      ),
    },
    {
      key: "actions",
      header: es.common.actions,
      className: "w-[100px] text-right",
      render: (p) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigate(`/persons/${p.id}`); }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleEdit(p, e)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => handleDelete(p, e)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={es.person.title}
        action={
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4" />
            {es.person.new}
          </Button>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center pb-4">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder={es.person.searchPlaceholder}
          className="sm:w-80"
        />
        <Select value={personType} onValueChange={(v) => { setPersonType(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={es.person.type} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{es.person.allTypes}</SelectItem>
            <SelectItem value="INDIVIDUAL">{es.person.individual}</SelectItem>
            <SelectItem value="LEGAL_ENTITY">{es.person.legalEntity}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <DataTable<Person>
          columns={columns}
          data={persons}
          isLoading={isLoading}
          onRowClick={(row) => navigate(`/persons/${row.id}`)}
        />
      </div>

      <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />

      <PersonForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditPerson(null); }}
        person={editPerson}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        title={es.person.deleteConfirmTitle}
        description={es.person.deleteConfirmDescription}
        confirmText={es.common.delete}
        variant="danger"
      />
    </div>
  );
}
