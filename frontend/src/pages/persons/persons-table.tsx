import { Trash2 } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { es } from "@/i18n/es";
import type { Person } from "@shared";

// Nombre mostrado en la tabla:
// - persona física: "Apellido, Nombre"
// - persona jurídica: razón social
// No agregamos columna en la DB — es puro render.
export function formatPersonName(p: Person): string {
  if (p.personType === "LEGAL_ENTITY") {
    return p.businessName?.trim() || "—";
  }
  const last = p.lastName?.trim() ?? "";
  const first = p.firstName?.trim() ?? "";
  if (!last && !first) return "—";
  if (!last) return first;
  if (!first) return last;
  return `${last}, ${first}`;
}

interface PersonsTableProps {
  data: Person[];
  isLoading?: boolean;
  onRowClick: (person: Person) => void;
  onDeleteClick: (person: Person) => void;
}

export function PersonsTable({
  data,
  isLoading,
  onRowClick,
  onDeleteClick,
}: PersonsTableProps) {
  const columns: ColumnDef<Person>[] = [
    {
      key: "name",
      header: es.persons.table.name,
      render: (row) => (
        <span className="font-medium">{formatPersonName(row)}</span>
      ),
    },
    {
      key: "cuitCuil",
      header: es.persons.table.cuitCuil,
      render: (row) => row.cuitCuil ?? "—",
    },
    {
      key: "phone",
      header: es.persons.table.phone,
      render: (row) => row.mobilePhone ?? row.phone ?? "—",
    },
    {
      key: "email",
      header: es.persons.table.email,
      render: (row) => row.email ?? "—",
    },
    {
      key: "actions",
      header: "",
      className: "w-12 text-right",
      render: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={es.persons.table.deleteAction}
          onClick={(e) => {
            // Evita que se abra el modal de editar al clickear la papelera.
            e.stopPropagation();
            onDeleteClick(row);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <DataTable<Person>
      columns={columns}
      data={data}
      isLoading={isLoading}
      onRowClick={onRowClick}
      emptyMessage={es.persons.emptyState}
    />
  );
}
