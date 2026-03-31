import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCase } from "@/hooks/use-case";
import { useMovements, useDeleteMovement } from "@/hooks/use-movements";
import { useErrands, useDeleteErrand, useMarkErrandCompleted } from "@/hooks/use-errands";
import { es } from "@/i18n/es";
import { ApiError } from "@/services/api";
import type { Movement, Errand } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MovementForm } from "./movement-form";
import { ErrandForm } from "./errand-form";
import {
  ArrowLeft,
  Loader2,
  Plus,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Download,
  FileText,
  CheckCircle2,
} from "lucide-react";

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: caseData, isLoading } = useCase(id);
  const { data: movementsData } = useMovements(id, { sort: "occurred_at", order: "desc", limit: 100 });
  const { data: errandsData } = useErrands(id, { sort: "due_at", order: "asc", limit: 100 });

  // Movement state
  const [movementFormOpen, setMovementFormOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [deletingMovementId, setDeletingMovementId] = useState<string | null>(null);
  const [expandedMovementId, setExpandedMovementId] = useState<string | null>(null);

  // Errand state
  const [errandFormOpen, setErrandFormOpen] = useState(false);
  const [editingErrand, setEditingErrand] = useState<Errand | null>(null);
  const [deletingErrandId, setDeletingErrandId] = useState<string | null>(null);

  const deleteMovementMutation = useDeleteMovement(id ?? "");
  const deleteErrandMutation = useDeleteErrand(id ?? "");
  const markCompletedMutation = useMarkErrandCompleted(id ?? "");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        {es.cases.notFound}
      </div>
    );
  }

  const movements = movementsData?.data ?? [];
  const errands = errandsData?.data ?? [];

  async function handleDeleteMovement() {
    if (!deletingMovementId) return;
    try {
      await deleteMovementMutation.mutateAsync(deletingMovementId);
      toast.success(es.movements.deleted);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    }
    setDeletingMovementId(null);
  }

  async function handleDeleteErrand() {
    if (!deletingErrandId) return;
    try {
      await deleteErrandMutation.mutateAsync(deletingErrandId);
      toast.success(es.errands.deleted);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    }
    setDeletingErrandId(null);
  }

  async function handleMarkCompleted(errandId: string) {
    try {
      await markCompletedMutation.mutateAsync(errandId);
      toast.success(es.errands.updated);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    }
  }

  function isOverdue(errand: Errand): boolean {
    if (errand.status === "COMPLETED" || errand.status === "FAILED") return false;
    if (!errand.dueAt) return false;
    return new Date(errand.dueAt) < new Date();
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <div>
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/cases")}>
          <ArrowLeft className="h-4 w-4" />
          {es.common.back}
        </Button>
      </div>

      <PageHeader
        title={caseData.caseTitle}
        description={caseData.caseNumber ? `${es.cases.caseNumber}: ${caseData.caseNumber}` : undefined}
        action={<StatusBadge status={caseData.status} />}
      />

      <Tabs defaultValue="movements">
        <TabsList>
          <TabsTrigger value="movements">
            {es.movements.title} ({movements.length})
          </TabsTrigger>
          <TabsTrigger value="errands">
            {es.errands.title} ({errands.length})
          </TabsTrigger>
        </TabsList>

        {/* ========== TAB MOVIMIENTOS ========== */}
        <TabsContent value="movements">
          <div className="mt-4">
            <div className="mb-4 flex justify-end">
              <Button
                onClick={() => {
                  setEditingMovement(null);
                  setMovementFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                {es.movements.add}
              </Button>
            </div>

            {movements.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {es.movements.noMovements}
              </p>
            ) : (
              <div className="relative">
                {/* Timeline vertical line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

                <div className="space-y-0">
                  {movements.map((m) => {
                    const isExpanded = expandedMovementId === m.id;
                    return (
                      <div key={m.id} className="relative pl-10">
                        {/* Timeline dot */}
                        <div className="absolute left-[11px] top-4 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background" />

                        <div
                          className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted/50"
                          onClick={() => setExpandedMovementId(isExpanded ? null : m.id)}
                        >
                          {/* Header row */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(m.occurredAt)}
                                  </span>
                                  <StatusBadge
                                    status={m.movementType}
                                    label={
                                      es.movements.types[
                                        m.movementType as keyof typeof es.movements.types
                                      ] ?? m.movementType
                                    }
                                    variant="info"
                                  />
                                </div>
                                <p className="mt-1 text-sm font-medium">{m.title}</p>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div
                              className="flex items-center gap-1 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingMovement(m);
                                  setMovementFormOpen(true);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => setDeletingMovementId(m.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div className="mt-3 space-y-2 border-t pt-3">
                              {m.description && (
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {m.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                {m.volume && (
                                  <span>
                                    {es.cases.volume}: {m.volume}
                                  </span>
                                )}
                                {m.page && (
                                  <span>
                                    {es.cases.page}: {m.page}
                                  </span>
                                )}
                                {m.createdByName && (
                                  <span>
                                    {es.movements.loadedBy}: {m.createdByName}
                                  </span>
                                )}
                              </div>
                              {m.documentName && m.documentUrl && (
                                <div className="flex items-center gap-2 mt-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{m.documentName}</span>
                                  <a
                                    href={m.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                    {es.movements.download}
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ========== TAB GESTIONES ========== */}
        <TabsContent value="errands">
          <div className="mt-4">
            <div className="mb-4 flex justify-end">
              <Button
                onClick={() => {
                  setEditingErrand(null);
                  setErrandFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                {es.errands.add}
              </Button>
            </div>

            {errands.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {es.errands.noErrands}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                      <th className="px-3 py-2">{es.errands.type}</th>
                      <th className="px-3 py-2">{es.errands.status}</th>
                      <th className="px-3 py-2">{es.errands.assignee}</th>
                      <th className="px-3 py-2">{es.errands.dueDate}</th>
                      <th className="px-3 py-2">{es.errands.completedDate}</th>
                      <th className="px-3 py-2">{es.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errands.map((errand) => {
                      const overdue = isOverdue(errand);
                      return (
                        <tr
                          key={errand.id}
                          className={`border-b transition-colors hover:bg-muted/50 ${
                            overdue ? "bg-red-500/5" : ""
                          }`}
                        >
                          <td className="px-3 py-3">
                            {es.errands.types[
                              errand.errandType as keyof typeof es.errands.types
                            ] ?? errand.errandType}
                          </td>
                          <td className="px-3 py-3">
                            <StatusBadge status={errand.status} />
                            {overdue && (
                              <span className="ml-2 text-xs font-medium text-red-600 dark:text-red-400">
                                {es.errands.overdue}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {errand.assigneeName ?? "—"}
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {errand.dueAt ? (
                              <span className={overdue ? "font-medium text-red-600 dark:text-red-400" : ""}>
                                {formatDate(errand.dueAt)}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {errand.completedAt ? formatDate(errand.completedAt) : "—"}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingErrand(errand);
                                  setErrandFormOpen(true);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              {errand.status !== "COMPLETED" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-emerald-600"
                                  onClick={() => handleMarkCompleted(errand.id)}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => setDeletingErrandId(errand.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ========== DIALOGS ========== */}
      <MovementForm
        open={movementFormOpen}
        onClose={() => {
          setMovementFormOpen(false);
          setEditingMovement(null);
        }}
        caseId={id!}
        movement={editingMovement}
      />

      <ErrandForm
        open={errandFormOpen}
        onClose={() => {
          setErrandFormOpen(false);
          setEditingErrand(null);
        }}
        caseId={id!}
        errand={editingErrand}
      />

      <ConfirmDialog
        open={!!deletingMovementId}
        onConfirm={handleDeleteMovement}
        onCancel={() => setDeletingMovementId(null)}
        title={es.movements.deleteConfirmTitle}
        description={es.movements.deleteConfirmDescription}
        confirmText={es.common.delete}
        variant="danger"
      />

      <ConfirmDialog
        open={!!deletingErrandId}
        onConfirm={handleDeleteErrand}
        onCancel={() => setDeletingErrandId(null)}
        title={es.errands.deleteConfirmTitle}
        description={es.errands.deleteConfirmDescription}
        confirmText={es.common.delete}
        variant="danger"
      />
    </div>
  );
}
