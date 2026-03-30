import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCase, useDeleteCase, useAddParty, useRemoveParty } from "@/hooks/use-cases";
import { es } from "@/i18n/es";
import { PartyRole } from "@/types";
import { ApiError } from "@/services/api";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { PersonSelect } from "@/components/ui/person-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Pencil, Trash2, ArrowLeft, Loader2, Plus, UserMinus, Clock } from "lucide-react";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null) return "—";
  const cur = currency ?? "ARS";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: cur }).format(amount);
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value || "—"}</p>
    </div>
  );
}

function PlaceholderTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Clock className="h-8 w-8 mb-2" />
      <p className="text-sm">{es.common.comingSoon}</p>
    </div>
  );
}

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: caseData, isLoading } = useCase(id);
  const deleteMutation = useDeleteCase();
  const addPartyMutation = useAddParty();
  const removePartyMutation = useRemoveParty();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addPartyOpen, setAddPartyOpen] = useState(false);
  const [removePartyTarget, setRemovePartyTarget] = useState<{ id: string; name: string } | null>(null);
  const [newPartyPersonId, setNewPartyPersonId] = useState<string | null>(null);
  const [newPartyRole, setNewPartyRole] = useState<string>("");

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

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(caseData!.id);
      toast.success(es.cases.deleted);
      navigate("/cases");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    }
    setDeleteOpen(false);
  }

  async function handleAddParty() {
    if (!newPartyPersonId || !newPartyRole) return;
    try {
      await addPartyMutation.mutateAsync({
        caseId: caseData!.id,
        personId: newPartyPersonId,
        role: newPartyRole as PartyRole,
      });
      toast.success(es.cases.partyAdded);
      setAddPartyOpen(false);
      setNewPartyPersonId(null);
      setNewPartyRole("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    }
  }

  async function handleRemoveParty() {
    if (!removePartyTarget) return;
    try {
      await removePartyMutation.mutateAsync({
        caseId: caseData!.id,
        partyId: removePartyTarget.id,
      });
      toast.success(es.cases.partyRemoved);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    }
    setRemovePartyTarget(null);
  }

  function partyDisplayName(p: { firstName: string; lastName: string; businessName: string | null }): string {
    if (p.businessName) return p.businessName;
    return `${p.lastName}, ${p.firstName}`;
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
        description={
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">{caseData.caseNumber}</span>
            <StatusBadge status={caseData.status} />
            <span className="text-sm text-muted-foreground">
              {es.jurisdictionTypes[caseData.jurisdictionType]}
            </span>
            {caseData.court && (
              <span className="text-sm text-muted-foreground">
                — {caseData.court.name}
              </span>
            )}
          </div>
        }
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/cases/${id}/edit`)}>
              <Pencil className="h-4 w-4" />
              {es.common.edit}
            </Button>
            <Button variant="outline" className="text-destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              {es.common.delete}
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">{es.cases.tabSummary}</TabsTrigger>
          <TabsTrigger value="parties">
            {es.cases.tabParties} ({caseData.parties.length})
          </TabsTrigger>
          <TabsTrigger value="movements">{es.cases.tabMovements}</TabsTrigger>
          <TabsTrigger value="errands">{es.cases.tabErrands}</TabsTrigger>
          <TabsTrigger value="documents">{es.cases.tabDocuments}</TabsTrigger>
          <TabsTrigger value="calendar">{es.cases.tabCalendar}</TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="summary">
          <div className="mt-4 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{es.cases.sectionCaseData}</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label={es.cases.caseNumber} value={caseData.caseNumber} />
                <Field label={es.cases.caseTitle} value={caseData.caseTitle} />
                <Field label={es.cases.jurisdictionType} value={es.jurisdictionTypes[caseData.jurisdictionType]} />
                <Field label={es.cases.jurisdiction} value={caseData.jurisdiction} />
                <Field label={es.cases.processType} value={caseData.processType} />
                <Field label={es.cases.status} value={es.caseStatuses[caseData.status]} />
                <Field label={es.cases.startDate} value={formatDate(caseData.startDate)} />
                <Field label={es.cases.assignedAttorney} value={caseData.assignedAttorneyName} />
              </div>
            </div>

            {caseData.court && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">{es.cases.sectionCourt}</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label={es.cases.courtName} value={caseData.court.name} />
                  <Field label={es.cases.courtClerkOffice} value={caseData.court.clerkOffice} />
                  <Field label={es.cases.courtJurisdiction} value={caseData.court.jurisdiction} />
                  <Field label={es.cases.courtAddress} value={caseData.court.address} />
                  <Field label={es.cases.courtPhone} value={caseData.court.phone} />
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{es.cases.sectionEconomic}</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={es.cases.claimedAmount} value={formatCurrency(caseData.claimedAmount, caseData.currency)} />
                <Field label={es.cases.currency} value={caseData.currency} />
              </div>
            </div>

            {caseData.portalUrl && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">{es.cases.sectionPortal}</h3>
                <Field label={es.cases.portalUrl} value={caseData.portalUrl} />
              </div>
            )}

            {caseData.notes && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">{es.cases.sectionNotes}</h3>
                <p className="text-sm whitespace-pre-wrap">{caseData.notes}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab: Partes */}
        <TabsContent value="parties">
          <div className="mt-4">
            <div className="mb-4 flex justify-end">
              <Button size="sm" onClick={() => setAddPartyOpen(true)}>
                <Plus className="h-4 w-4" />
                {es.cases.addParty}
              </Button>
            </div>

            {caseData.parties.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{es.common.noResults}</p>
            ) : (
              <div className="space-y-2">
                {caseData.parties.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{partyDisplayName(p)}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.personType === "LEGAL_ENTITY" ? "Persona jurídica" : "Persona física"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={p.role} label={es.partyRoles[p.role]} variant="info" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setRemovePartyTarget({ id: p.id, name: partyDisplayName(p) })}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Placeholder tabs */}
        <TabsContent value="movements"><PlaceholderTab /></TabsContent>
        <TabsContent value="errands"><PlaceholderTab /></TabsContent>
        <TabsContent value="documents"><PlaceholderTab /></TabsContent>
        <TabsContent value="calendar"><PlaceholderTab /></TabsContent>
      </Tabs>

      {/* Dialog: Agregar parte */}
      <Dialog open={addPartyOpen} onOpenChange={(v) => !v && setAddPartyOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{es.cases.addParty}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormField label={es.cases.selectPerson}>
              <PersonSelect
                value={newPartyPersonId}
                onChange={setNewPartyPersonId}
              />
            </FormField>
            <FormField label={es.cases.selectRole}>
              <Select value={newPartyRole} onValueChange={setNewPartyRole}>
                <SelectTrigger><SelectValue placeholder={es.cases.selectRole} /></SelectTrigger>
                <SelectContent>
                  {Object.values(PartyRole).map((role) => (
                    <SelectItem key={role} value={role}>{es.partyRoles[role]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPartyOpen(false)}>{es.common.cancel}</Button>
            <Button
              onClick={handleAddParty}
              disabled={!newPartyPersonId || !newPartyRole || addPartyMutation.isPending}
            >
              {addPartyMutation.isPending && <Loader2 className="animate-spin" />}
              {es.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm: Quitar parte */}
      <ConfirmDialog
        open={!!removePartyTarget}
        onConfirm={handleRemoveParty}
        onCancel={() => setRemovePartyTarget(null)}
        title={es.cases.removePartyConfirmTitle}
        description={es.cases.removePartyConfirmDescription}
        confirmText={es.cases.removeParty}
        variant="danger"
      />

      {/* Confirm: Eliminar expediente */}
      <ConfirmDialog
        open={deleteOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        title={es.cases.deleteConfirmTitle}
        description={es.cases.deleteConfirmDescription}
        confirmText={es.common.delete}
        variant="danger"
      />
    </div>
  );
}
