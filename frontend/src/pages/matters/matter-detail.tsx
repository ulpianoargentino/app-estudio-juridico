import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useMatter, useDeleteMatter, useConvertMatterToCase } from "@/hooks/use-matters";
import { es } from "@/i18n/es";
import { ApiError } from "@/services/api";
import type { Matter } from "@/services/matter.service";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { MatterForm } from "./matter-form";
import { Pencil, Trash2, ArrowLeft, Loader2, ArrowRightLeft, ExternalLink, Info } from "lucide-react";

const matterTypeLabels: Record<string, string> = {
  CONSULTATION: es.matters.type.consultation,
  CONTRACT: es.matters.type.contract,
  NEGOTIATION: es.matters.type.negotiation,
  ADVISORY: es.matters.type.advisory,
  OPINION: es.matters.type.opinion,
  OTHER: es.matters.type.other,
};

const roleLabels: Record<string, string> = {
  PLAINTIFF: "Actor",
  DEFENDANT: "Demandado",
  ATTORNEY: "Abogado",
  PROCESS_SERVER: "Procurador",
  EXPERT_WITNESS: "Perito",
  WITNESS: "Testigo",
  JUDGE: "Juez",
  CLERK: "Secretario",
  CLIENT: "Cliente",
  OPPOSING_PARTY: "Contraparte",
};

const jurisdictionTypeLabels: Record<string, string> = {
  CIVIL_COMMERCIAL: "Civil y Comercial",
  LABOR: "Laboral",
  CRIMINAL: "Penal",
  FAMILY: "Familia",
  ADMINISTRATIVE: "Contencioso Administrativo",
  COLLECTIONS: "Cobros y Apremios",
  PROBATE: "Sucesiones",
  EXTRAJUDICIAL: "Extrajudicial",
};

const convertSchema = z.object({
  caseTitle: z.string().min(1, "La carátula es obligatoria"),
  caseNumber: z.string().optional(),
  jurisdictionType: z.string().min(1, "El fuero es obligatorio"),
  jurisdiction: z.string().optional(),
  processType: z.string().optional(),
  status: z.string().default("INITIAL"),
});

interface ConvertFormState {
  caseTitle: string;
  caseNumber: string;
  jurisdictionType: string;
  jurisdiction: string;
  processType: string;
  status: string;
}

const emptyConvertForm: ConvertFormState = {
  caseTitle: "",
  caseNumber: "",
  jurisdictionType: "",
  jurisdiction: "",
  processType: "",
  status: "INITIAL",
};

export function MatterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: matter, isLoading } = useMatter(id);
  const deleteMutation = useDeleteMatter();
  const convertMutation = useConvertMatterToCase();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertForm, setConvertForm] = useState(emptyConvertForm);
  const [convertErrors, setConvertErrors] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!matter) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        {es.matters.notFound}
      </div>
    );
  }

  const isConverted = !!matter.convertedToCaseId;

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(matter!.id);
      toast.success(es.matters.deleted);
      navigate("/matters");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    }
    setDeleteOpen(false);
  }

  function setConvertField(field: string, value: string) {
    setConvertForm((prev) => ({ ...prev, [field]: value }));
    setConvertErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  function openConvertDialog() {
    setConvertForm({
      ...emptyConvertForm,
      caseTitle: matter!.title,
    });
    setConvertErrors({});
    setConvertOpen(true);
  }

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    const result = convertSchema.safeParse(convertForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setConvertErrors(fieldErrors);
      return;
    }

    const payload: Record<string, unknown> = { ...result.data };
    for (const [k, v] of Object.entries(payload)) {
      if (v === "") payload[k] = null;
    }

    try {
      await convertMutation.mutateAsync({ id: matter!.id, data: payload });
      toast.success(es.matters.convertSuccess);
      setConvertOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    }
  }

  const primaryClientName = matter.primaryClient
    ? (matter.primaryClient.businessName || `${matter.primaryClient.firstName} ${matter.primaryClient.lastName}`)
    : null;

  const attorneyName = matter.responsibleAttorney
    ? `${matter.responsibleAttorney.firstName} ${matter.responsibleAttorney.lastName}`
    : null;

  function formatCurrency(amount: string | null, currency: string): string {
    if (!amount) return "—";
    const num = Number(amount);
    if (isNaN(num)) return amount;
    return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(num);
  }

  return (
    <div>
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/matters")}>
          <ArrowLeft className="h-4 w-4" />
          {es.common.back}
        </Button>
      </div>

      {isConverted && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3">
          <Info className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {es.matters.convertedBanner}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto shrink-0"
            onClick={() => navigate(`/cases/${matter.convertedToCaseId}`)}
          >
            <ExternalLink className="h-4 w-4" />
            {es.matters.viewCase}
          </Button>
        </div>
      )}

      <PageHeader
        title={matter.title}
        description={matterTypeLabels[matter.matterType] ?? matter.matterType}
        action={
          <div className="flex gap-2">
            {!isConverted && (
              <Button variant="outline" onClick={openConvertDialog}>
                <ArrowRightLeft className="h-4 w-4" />
                {es.matters.convert}
              </Button>
            )}
            <Button variant="outline" onClick={() => setFormOpen(true)}>
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

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{es.matters.generalData}</TabsTrigger>
          <TabsTrigger value="parties">
            {es.matters.parties} ({matter.parties.length})
          </TabsTrigger>
          <TabsTrigger value="movements">{es.matters.movements}</TabsTrigger>
          <TabsTrigger value="documents">{es.matters.documents}</TabsTrigger>
          <TabsTrigger value="calendar">{es.matters.calendar}</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={es.matters.matterTitle} value={matter.title} />
            <Field label={es.matters.matterType} value={matterTypeLabels[matter.matterType]} />
            <div>
              <p className="text-xs font-medium text-muted-foreground">{es.matters.status}</p>
              <div className="mt-0.5"><StatusBadge status={matter.status} /></div>
            </div>
            <Field label={es.matters.client} value={primaryClientName} />
            <Field label={es.matters.responsibleAttorney} value={attorneyName} />
            <Field
              label={es.matters.startDate}
              value={matter.startDate ? new Date(matter.startDate).toLocaleDateString("es-AR") : null}
            />
            <Field
              label={es.matters.estimatedFee}
              value={formatCurrency(matter.estimatedFee, matter.currency)}
            />
            <Field label={es.matters.currency} value={matter.currency} />
            {matter.notes && (
              <div className="sm:col-span-2 lg:col-span-3">
                <Field label={es.matters.notes} value={matter.notes} />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="parties">
          {matter.parties.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{es.common.noResults}</p>
          ) : (
            <div className="mt-4 space-y-2">
              {matter.parties.map((p) => {
                const name = p.businessName || `${p.firstName} ${p.lastName}`;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/persons/${p.personId}`)}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{name}</p>
                      {p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
                    </div>
                    <StatusBadge status={p.role} label={roleLabels[p.role] ?? p.role} variant="info" />
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="movements">
          <p className="py-8 text-center text-sm text-muted-foreground">{es.common.comingSoon}</p>
        </TabsContent>

        <TabsContent value="documents">
          <p className="py-8 text-center text-sm text-muted-foreground">{es.common.comingSoon}</p>
        </TabsContent>

        <TabsContent value="calendar">
          <p className="py-8 text-center text-sm text-muted-foreground">{es.common.comingSoon}</p>
        </TabsContent>
      </Tabs>

      <MatterForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        matter={matter as unknown as Matter}
      />

      <ConfirmDialog
        open={deleteOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        title={es.matters.deleteConfirmTitle}
        description={es.matters.deleteConfirmDescription}
        confirmText={es.common.delete}
        variant="danger"
      />

      {/* Convert to Case dialog */}
      <Dialog open={convertOpen} onOpenChange={(v) => !v && setConvertOpen(false)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{es.matters.convertTitle}</DialogTitle>
            <DialogDescription>{es.matters.convertDescription}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConvert} className="space-y-4">
            <FormField label={es.cases.caseTitle} error={convertErrors.caseTitle} required>
              <Input value={convertForm.caseTitle} onChange={(e) => setConvertField("caseTitle", e.target.value)} />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label={es.cases.caseNumber}>
                <Input value={convertForm.caseNumber} onChange={(e) => setConvertField("caseNumber", e.target.value)} />
              </FormField>

              <FormField label={es.cases.jurisdictionType} error={convertErrors.jurisdictionType} required>
                <Select value={convertForm.jurisdictionType} onValueChange={(v) => setConvertField("jurisdictionType", v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar fuero" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(jurisdictionTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label={es.cases.jurisdiction}>
                <Input
                  value={convertForm.jurisdiction}
                  onChange={(e) => setConvertField("jurisdiction", e.target.value)}
                  placeholder="Ej: Bahía Blanca"
                />
              </FormField>

              <FormField label="Tipo de proceso">
                <Input
                  value={convertForm.processType}
                  onChange={(e) => setConvertField("processType", e.target.value)}
                  placeholder="Ej: Ordinario, Sumarísimo"
                />
              </FormField>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConvertOpen(false)}>{es.common.cancel}</Button>
              <Button type="submit" disabled={convertMutation.isPending}>
                {convertMutation.isPending && <Loader2 className="animate-spin" />}
                {es.matters.convertConfirm}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value || "—"}</p>
    </div>
  );
}
