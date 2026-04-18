import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Archive, ArchiveRestore, Loader2, Pencil, Network } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCase, useArchiveCase, useUnarchiveCase } from "@/hooks/queries/cases";
import { ApiError } from "@/services/api";
import { es } from "@/i18n/es";
import { toast } from "sonner";
import type { CaseDetail } from "@shared";
import { SubCasesTab } from "./sub-cases-tab";

type CaseStatusKey = keyof typeof es.cases.status;
type JurisdictionTypeKey = keyof typeof es.cases.jurisdictionType;
type DetailFieldKey = keyof typeof es.cases.detail.fields;

function formatClient(c: CaseDetail["primaryClient"]): string {
  if (!c) return es.cases.detail.notAvailable;
  if (c.businessName) return c.businessName;
  return `${c.lastName}, ${c.firstName}`;
}

function formatAttorney(a: CaseDetail["responsibleAttorney"]): string {
  if (!a) return es.cases.detail.notAvailable;
  return `${a.firstName} ${a.lastName}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return es.cases.detail.notAvailable;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return es.cases.detail.notAvailable;
  return d.toLocaleDateString("es-AR");
}

function formatMoney(amount: string | null, currency: string | null): string {
  if (!amount) return es.cases.detail.notAvailable;
  const c = currency ?? "ARS";
  return `${c} ${amount}`;
}

interface DetailRowProps {
  fieldKey: DetailFieldKey;
  value: string | null | React.ReactNode;
}

function DetailRow({ fieldKey, value }: DetailRowProps) {
  const content =
    value === null || value === undefined || value === ""
      ? es.cases.detail.notAvailable
      : value;
  return (
    <div className="grid grid-cols-1 gap-1 border-b py-3 sm:grid-cols-[200px_1fr]">
      <dt className="text-sm font-medium text-muted-foreground">
        {es.cases.detail.fields[fieldKey]}
      </dt>
      <dd className="text-sm">{content}</dd>
    </div>
  );
}

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useCase(id);
  const archiveMutation = useArchiveCase();
  const unarchiveMutation = useUnarchiveCase();
  const [confirmOpen, setConfirmOpen] = useState<"archive" | "unarchive" | null>(
    null
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate("/cases")}
        >
          <ArrowLeft className="h-4 w-4" />
          {es.cases.backToList}
        </Button>
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {isError ? es.cases.detail.loadError : es.cases.detail.notFound}
          </p>
        </div>
      </div>
    );
  }

  const isArchived = !data.isActive;

  async function handleConfirm() {
    if (!data || !confirmOpen) return;
    try {
      if (confirmOpen === "archive") {
        await archiveMutation.mutateAsync(data.id);
        toast.success(es.cases.toast.archived);
      } else {
        await unarchiveMutation.mutateAsync(data.id);
        toast.success(es.cases.toast.unarchived);
      }
      setConfirmOpen(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : es.cases.toast.error;
      toast.error(message);
    }
  }

  const statusLabel =
    es.cases.status[data.status as CaseStatusKey] ?? data.status;
  const jurisdictionLabel =
    es.cases.jurisdictionType[data.jurisdictionType as JurisdictionTypeKey] ??
    data.jurisdictionType;

  const isSubCase = data.subCaseType !== null || data.parent !== null;

  // Header del case:
  // - Padre/normal: title = carátula, description = caseNumber.
  // - Sub con subCaseNumber + padre con caseNumber: title = "{padre}-{sub}",
  //   description = carátula propia (que puede haberse editado al crearlo).
  // - Sub sin subCaseNumber: title = carátula propia, sin description.
  let headerTitle: string;
  let headerDescription: string | undefined;
  if (isSubCase) {
    const parentNum = data.parent?.caseNumber ?? null;
    if (data.subCaseNumber && parentNum) {
      headerTitle = `${parentNum}-${data.subCaseNumber}`;
      headerDescription = data.caseTitle;
    } else {
      headerTitle = data.caseTitle;
      headerDescription = undefined;
    }
  } else {
    headerTitle = data.caseTitle;
    headerDescription = data.caseNumber ?? undefined;
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate("/cases")}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {es.cases.backToList}
        </Button>
        {isSubCase && data.parent && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-4 py-2 text-sm">
            <Network className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">
              {es.cases.detail.subCaseBanner}
            </span>
            <Link
              to={`/cases/${data.parent.id}`}
              className="font-medium text-primary hover:underline"
            >
              {data.parent.caseNumber
                ? `${data.parent.caseNumber} — ${data.parent.caseTitle}`
                : data.parent.caseTitle}
            </Link>
          </div>
        )}
        <PageHeader
          title={headerTitle}
          description={headerDescription}
          action={
            <div className="flex items-center gap-2">
              {isArchived && (
                <StatusBadge
                  status="ARCHIVED"
                  label={es.cases.detail.archivedBadge}
                />
              )}
              <Button
                variant="outline"
                onClick={() => navigate(`/cases/${data.id}/edit`)}
              >
                <Pencil className="h-4 w-4" />
                {es.cases.detail.editButton}
              </Button>
              {isArchived ? (
                <Button
                  variant="outline"
                  onClick={() => setConfirmOpen("unarchive")}
                >
                  <ArchiveRestore className="h-4 w-4" />
                  {es.cases.detail.unarchiveButton}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setConfirmOpen("archive")}
                >
                  <Archive className="h-4 w-4" />
                  {es.cases.detail.archiveButton}
                </Button>
              )}
            </div>
          }
        />
      </div>

      <Tabs defaultValue="detail">
        <TabsList>
          <TabsTrigger value="detail">{es.cases.detail.tabs.detail}</TabsTrigger>
          <TabsTrigger value="movements">
            {es.cases.detail.tabs.movements}
            {data.movementCount > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({data.movementCount})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="parties">
            {es.cases.detail.tabs.parties}
            {data.parties.length > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({data.parties.length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents">
            {es.cases.detail.tabs.documents}
            {data.documentCount > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({data.documentCount})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="events">
            {es.cases.detail.tabs.events}
            {data.upcomingEventCount > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({data.upcomingEventCount})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="subCases">
            {es.cases.subCases.tabLabel}
            {data.subCaseCount > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({data.subCaseCount})
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="detail">
          <dl className="divide-y rounded-lg border bg-card px-6">
            <DetailRow fieldKey="caseNumber" value={data.caseNumber} />
            <DetailRow fieldKey="caseTitle" value={data.caseTitle} />
            <DetailRow fieldKey="jurisdictionType" value={jurisdictionLabel} />
            <DetailRow fieldKey="jurisdiction" value={data.jurisdiction} />
            <DetailRow
              fieldKey="court"
              value={data.court ? data.court.name : null}
            />
            <DetailRow fieldKey="processType" value={data.processType} />
            <DetailRow
              fieldKey="status"
              value={
                <StatusBadge status={data.status} label={statusLabel} />
              }
            />
            <DetailRow
              fieldKey="primaryClient"
              value={formatClient(data.primaryClient)}
            />
            <DetailRow
              fieldKey="responsibleAttorney"
              value={formatAttorney(data.responsibleAttorney)}
            />
            <DetailRow fieldKey="startDate" value={formatDate(data.startDate)} />
            <DetailRow
              fieldKey="claimedAmount"
              value={formatMoney(data.claimedAmount, data.currency)}
            />
            <DetailRow
              fieldKey="portalUrl"
              value={
                data.portalUrl ? (
                  <a
                    href={data.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {data.portalUrl}
                  </a>
                ) : null
              }
            />
            <DetailRow fieldKey="notes" value={data.notes} />
          </dl>
        </TabsContent>

        <TabsContent value="movements">
          <EmptyTab message={es.cases.detail.empty.movements} />
        </TabsContent>

        <TabsContent value="parties">
          {data.parties.length === 0 ? (
            <EmptyTab message={es.cases.detail.empty.parties} />
          ) : (
            <ul className="divide-y rounded-lg border bg-card">
              {data.parties.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {p.businessName ?? `${p.lastName ?? ""}, ${p.firstName ?? ""}`}
                    </p>
                    {p.notes && (
                      <p className="text-xs text-muted-foreground">{p.notes}</p>
                    )}
                  </div>
                  <StatusBadge status={p.role} />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <EmptyTab message={es.cases.detail.empty.documents} />
        </TabsContent>

        <TabsContent value="events">
          <EmptyTab message={es.cases.detail.empty.events} />
        </TabsContent>

        <TabsContent value="subCases">
          <SubCasesTab parent={data} />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmOpen !== null}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(null)}
        title={
          confirmOpen === "archive"
            ? es.cases.archive.title
            : es.cases.unarchive.title
        }
        description={(confirmOpen === "archive"
          ? es.cases.archive.body
          : es.cases.unarchive.body
        ).replace("{title}", data.caseTitle)}
        confirmText={
          confirmOpen === "archive"
            ? es.cases.archive.confirm
            : es.cases.unarchive.confirm
        }
        cancelText={
          confirmOpen === "archive"
            ? es.cases.archive.cancel
            : es.cases.unarchive.cancel
        }
        variant={confirmOpen === "archive" ? "danger" : "default"}
      />
    </div>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed px-6 py-12 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
