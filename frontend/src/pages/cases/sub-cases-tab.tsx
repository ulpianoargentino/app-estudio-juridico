import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useSubCases } from "@/hooks/queries/cases";
import { es } from "@/i18n/es";
import type { CaseDetail, SubCaseListItem } from "@shared";
import { SubCaseFormDialog } from "./sub-case-form-dialog";

type SubCaseTypeKey = keyof typeof es.cases.subCases.type;

function typeLabel(t: string): string {
  return es.cases.subCases.type[t as SubCaseTypeKey] ?? t;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR");
}

interface SubCasesTabProps {
  parent: CaseDetail;
}

export function SubCasesTab({ parent }: SubCasesTabProps) {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading, isError } = useSubCases(parent.id);

  // No-sub-de-sub: si el case actual es a su vez un sub, no permitimos crear
  // hijos. La tab se muestra (consistencia visual) pero sin botón y con
  // mensaje explícito.
  const isNested = parent.subCaseType !== null;

  if (isNested) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed px-6 py-12 text-sm text-muted-foreground">
        {es.cases.subCases.nestedNotAllowed}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed px-6 py-12 text-sm text-destructive">
        {es.cases.subCases.toast.loadError}
      </div>
    );
  }

  const subs: SubCaseListItem[] = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {es.cases.subCases.sectionTitle} ({subs.length})
        </h3>
        {subs.length > 0 && (
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4" />
            {es.cases.subCases.newButton}
          </Button>
        )}
      </div>

      {subs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {es.cases.subCases.empty}
          </p>
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4" />
            {es.cases.subCases.firstButton}
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">
                  {es.cases.subCases.table.number}
                </th>
                <th className="px-4 py-2 text-left">
                  {es.cases.subCases.table.type}
                </th>
                <th className="px-4 py-2 text-left">
                  {es.cases.subCases.table.description}
                </th>
                <th className="px-4 py-2 text-left">
                  {es.cases.subCases.table.status}
                </th>
                <th className="px-4 py-2 text-left">
                  {es.cases.subCases.table.createdAt}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {subs.map((sub) => (
                <tr
                  key={sub.id}
                  onClick={() => navigate(`/cases/${sub.id}`)}
                  className="cursor-pointer hover:bg-muted/30"
                >
                  <td className="px-4 py-2 font-medium">
                    {sub.subCaseNumber && sub.parentCaseNumber
                      ? `${sub.parentCaseNumber}-${sub.subCaseNumber}`
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {sub.subCaseType ? (
                      <StatusBadge
                        status={sub.subCaseType}
                        label={typeLabel(sub.subCaseType)}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {sub.subCaseDescription ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    {sub.isActive ? (
                      <StatusBadge
                        status="ACTIVE"
                        variant="success"
                        label={es.cases.subCases.table.statusActive}
                      />
                    ) : (
                      <StatusBadge
                        status="ARCHIVED"
                        variant="neutral"
                        label={es.cases.subCases.table.statusArchived}
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {formatDate(sub.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SubCaseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        parent={parent}
      />
    </div>
  );
}
