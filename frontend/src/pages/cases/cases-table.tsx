import { useMemo } from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useCourts } from "@/hooks/queries/courts";
import { es } from "@/i18n/es";
import type { CaseListItem } from "@shared";

type CaseStatusKey = keyof typeof es.cases.status;

function caseStatusLabel(status: string): string {
  return es.cases.status[status as CaseStatusKey] ?? status;
}

interface CasesTableProps {
  data: CaseListItem[];
  isLoading?: boolean;
  showArchived: boolean;
  onRowClick: (row: CaseListItem) => void;
  onArchiveClick?: (row: CaseListItem) => void;
  onUnarchiveClick?: (row: CaseListItem) => void;
}

export function CasesTable({
  data,
  isLoading,
  showArchived,
  onRowClick,
  onArchiveClick,
  onUnarchiveClick,
}: CasesTableProps) {
  const { data: courts } = useCourts();
  const courtNameById = useMemo(() => {
    const map = new Map<string, string>();
    (courts ?? []).forEach((c) => map.set(c.id, c.name));
    return map;
  }, [courts]);

  const columns: ColumnDef<CaseListItem>[] = [
    {
      key: "caseNumber",
      header: es.cases.table.caseNumber,
      render: (row) => row.caseNumber ?? "—",
    },
    {
      key: "caseTitle",
      header: es.cases.table.caseTitle,
      render: (row) => (
        <span className="font-medium">
          {row.caseTitle}
          {row.subCaseCount > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({row.subCaseCount}{" "}
              {row.subCaseCount === 1
                ? es.cases.subCases.countSuffixSingular
                : es.cases.subCases.countSuffix}
              )
            </span>
          )}
        </span>
      ),
    },
    {
      key: "court",
      header: es.cases.table.court,
      render: (row) => (row.courtId ? courtNameById.get(row.courtId) ?? "—" : "—"),
    },
    {
      key: "status",
      header: es.cases.table.status,
      render: (row) => (
        <StatusBadge status={row.status} label={caseStatusLabel(row.status)} />
      ),
    },
    {
      key: "client",
      header: es.cases.table.client,
      render: (row) => row.primaryClientName ?? "—",
    },
    {
      key: "actions",
      header: "",
      className: "w-12 text-right",
      render: (row) =>
        showArchived ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={es.cases.table.unarchiveAction}
            onClick={(e) => {
              e.stopPropagation();
              onUnarchiveClick?.(row);
            }}
          >
            <ArchiveRestore className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={es.cases.table.archiveAction}
            onClick={(e) => {
              e.stopPropagation();
              onArchiveClick?.(row);
            }}
          >
            <Archive className="h-4 w-4" />
          </Button>
        ),
    },
  ];

  return (
    <DataTable<CaseListItem>
      columns={columns}
      data={data}
      isLoading={isLoading}
      onRowClick={onRowClick}
      emptyMessage={
        showArchived ? es.cases.emptyStateArchived : es.cases.emptyStateActive
      }
    />
  );
}
