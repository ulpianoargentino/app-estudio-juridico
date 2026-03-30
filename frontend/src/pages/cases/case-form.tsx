import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { useCase, useCreateCase, useUpdateCase, useFirmUsers } from "@/hooks/use-cases";
import { es } from "@/i18n/es";
import { CaseStatus, JurisdictionType } from "@/types";
import { ApiError } from "@/services/api";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PersonSelect } from "@/components/ui/person-select";
import { ArrowLeft, Loader2 } from "lucide-react";

const caseSchema = z.object({
  caseNumber: z.string().min(1, es.cases.caseNumberRequired),
  caseTitle: z.string().min(1, es.cases.caseTitleRequired),
  jurisdictionType: z.nativeEnum(JurisdictionType, { message: es.cases.jurisdictionTypeRequired }),
  jurisdiction: z.string().optional(),
  processType: z.string().optional(),
  status: z.nativeEnum(CaseStatus),
  courtMode: z.enum(["existing", "new"]),
  courtId: z.string().optional(),
  courtName: z.string().optional(),
  courtClerkOffice: z.string().optional(),
  courtJurisdiction: z.string().optional(),
  courtAddress: z.string().optional(),
  courtPhone: z.string().optional(),
  clientPersonId: z.string().optional(),
  assignedAttorneyId: z.string().optional(),
  claimedAmount: z.string().optional(),
  currency: z.string().optional(),
  portalUrl: z.string().optional(),
  startDate: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (d) => d.courtMode !== "new" || (d.courtName && d.courtName.trim().length > 0),
  { message: es.cases.courtNameRequired, path: ["courtName"] }
);

interface FormState {
  caseNumber: string;
  caseTitle: string;
  jurisdictionType: string;
  jurisdiction: string;
  processType: string;
  status: string;
  courtMode: "existing" | "new";
  courtId: string;
  courtName: string;
  courtClerkOffice: string;
  courtJurisdiction: string;
  courtAddress: string;
  courtPhone: string;
  clientPersonId: string;
  assignedAttorneyId: string;
  claimedAmount: string;
  currency: string;
  portalUrl: string;
  startDate: string;
  notes: string;
}

const emptyForm: FormState = {
  caseNumber: "",
  caseTitle: "",
  jurisdictionType: "",
  jurisdiction: "",
  processType: "",
  status: CaseStatus.INITIAL,
  courtMode: "new",
  courtId: "",
  courtName: "",
  courtClerkOffice: "",
  courtJurisdiction: "",
  courtAddress: "",
  courtPhone: "",
  clientPersonId: "",
  assignedAttorneyId: "",
  claimedAmount: "",
  currency: "ARS",
  portalUrl: "",
  startDate: "",
  notes: "",
};

export function CaseFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { data: existingCase, isLoading: isLoadingCase } = useCase(id);
  const { data: firmUsers } = useFirmUsers();
  const createMutation = useCreateCase();
  const updateMutation = useUpdateCase();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (isEdit && existingCase) {
      setForm({
        caseNumber: existingCase.caseNumber,
        caseTitle: existingCase.caseTitle,
        jurisdictionType: existingCase.jurisdictionType,
        jurisdiction: existingCase.jurisdiction ?? "",
        processType: existingCase.processType ?? "",
        status: existingCase.status,
        courtMode: existingCase.courtId ? "existing" : "new",
        courtId: existingCase.courtId ?? "",
        courtName: existingCase.court?.name ?? "",
        courtClerkOffice: existingCase.court?.clerkOffice ?? "",
        courtJurisdiction: existingCase.court?.jurisdiction ?? "",
        courtAddress: existingCase.court?.address ?? "",
        courtPhone: existingCase.court?.phone ?? "",
        clientPersonId: existingCase.clientPersonId ?? "",
        assignedAttorneyId: existingCase.assignedAttorneyId ?? "",
        claimedAmount: existingCase.claimedAmount?.toString() ?? "",
        currency: existingCase.currency ?? "ARS",
        portalUrl: existingCase.portalUrl ?? "",
        startDate: existingCase.startDate ? existingCase.startDate.split("T")[0] : "",
        notes: existingCase.notes ?? "",
      });
    }
  }, [isEdit, existingCase]);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = caseSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    const payload: Record<string, unknown> = {
      caseNumber: form.caseNumber,
      caseTitle: form.caseTitle,
      jurisdictionType: form.jurisdictionType,
      jurisdiction: form.jurisdiction || null,
      processType: form.processType || null,
      status: form.status,
      clientPersonId: form.clientPersonId || null,
      assignedAttorneyId: form.assignedAttorneyId || null,
      claimedAmount: form.claimedAmount ? parseFloat(form.claimedAmount) : null,
      currency: form.currency || null,
      portalUrl: form.portalUrl || null,
      startDate: form.startDate || null,
      notes: form.notes || null,
    };

    if (form.courtMode === "existing" && form.courtId) {
      payload.courtId = form.courtId;
    } else if (form.courtMode === "new" && form.courtName) {
      payload.court = {
        name: form.courtName,
        clerkOffice: form.courtClerkOffice || null,
        jurisdiction: form.courtJurisdiction || null,
        address: form.courtAddress || null,
        phone: form.courtPhone || null,
      };
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: id!, data: payload });
        toast.success(es.cases.updated);
        navigate(`/cases/${id}`);
      } else {
        const created = await createMutation.mutateAsync(payload);
        toast.success(es.cases.created);
        navigate(`/cases/${created.id}`);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    }
  }

  if (isEdit && isLoadingCase) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(isEdit ? `/cases/${id}` : "/cases")}>
          <ArrowLeft className="h-4 w-4" />
          {es.common.back}
        </Button>
      </div>

      <PageHeader
        title={isEdit ? es.cases.edit : es.cases.new}
        description={isEdit ? es.cases.editDescription : es.cases.newDescription}
      />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
        {/* Sección: Datos del expediente */}
        <section>
          <h2 className="mb-4 text-lg font-medium border-b pb-2">{es.cases.sectionCaseData}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={es.cases.caseNumber} error={errors.caseNumber} required>
              <Input value={form.caseNumber} onChange={(e) => set("caseNumber", e.target.value)} />
            </FormField>
            <FormField label={es.cases.status} error={errors.status} required>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(CaseStatus).map((s) => (
                    <SelectItem key={s} value={s}>{es.caseStatuses[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="mt-4">
            <FormField label={es.cases.caseTitle} error={errors.caseTitle} required>
              <Input
                value={form.caseTitle}
                onChange={(e) => set("caseTitle", e.target.value)}
                placeholder="ACTOR c/ DEMANDADO s/ OBJETO"
              />
            </FormField>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label={es.cases.jurisdictionType} error={errors.jurisdictionType} required>
              <Select value={form.jurisdictionType} onValueChange={(v) => set("jurisdictionType", v)}>
                <SelectTrigger><SelectValue placeholder={es.cases.jurisdictionType} /></SelectTrigger>
                <SelectContent>
                  {Object.values(JurisdictionType).map((j) => (
                    <SelectItem key={j} value={j}>{es.jurisdictionTypes[j]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={es.cases.jurisdiction}>
              <Input
                value={form.jurisdiction}
                onChange={(e) => set("jurisdiction", e.target.value)}
                placeholder="Ej: Bahía Blanca"
              />
            </FormField>
            <FormField label={es.cases.processType}>
              <Input
                value={form.processType}
                onChange={(e) => set("processType", e.target.value)}
                placeholder="Ej: Ordinario"
              />
            </FormField>
          </div>
          <div className="mt-4">
            <FormField label={es.cases.startDate}>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className="w-full sm:w-48"
              />
            </FormField>
          </div>
        </section>

        {/* Sección: Juzgado */}
        <section>
          <h2 className="mb-4 text-lg font-medium border-b pb-2">{es.cases.sectionCourt}</h2>
          <div className="mb-4">
            <Select value={form.courtMode} onValueChange={(v) => set("courtMode", v)}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">{es.cases.createNewCourt}</SelectItem>
                <SelectItem value="existing">{es.cases.selectCourt}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.courtMode === "new" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label={es.cases.courtName} error={errors.courtName} required>
                <Input value={form.courtName} onChange={(e) => set("courtName", e.target.value)} />
              </FormField>
              <FormField label={es.cases.courtClerkOffice}>
                <Input value={form.courtClerkOffice} onChange={(e) => set("courtClerkOffice", e.target.value)} />
              </FormField>
              <FormField label={es.cases.courtJurisdiction}>
                <Input value={form.courtJurisdiction} onChange={(e) => set("courtJurisdiction", e.target.value)} />
              </FormField>
              <FormField label={es.cases.courtAddress}>
                <Input value={form.courtAddress} onChange={(e) => set("courtAddress", e.target.value)} />
              </FormField>
              <FormField label={es.cases.courtPhone}>
                <Input value={form.courtPhone} onChange={(e) => set("courtPhone", e.target.value)} />
              </FormField>
            </div>
          ) : (
            <div>
              <FormField label={es.cases.court}>
                <Input
                  value={form.courtId}
                  onChange={(e) => set("courtId", e.target.value)}
                  placeholder={es.cases.searchCourt}
                />
              </FormField>
              <p className="mt-1 text-xs text-muted-foreground">
                {es.common.comingSoon} — La búsqueda de juzgados estará disponible próximamente.
              </p>
            </div>
          )}
        </section>

        {/* Sección: Partes */}
        <section>
          <h2 className="mb-4 text-lg font-medium border-b pb-2">{es.cases.sectionParties}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={es.cases.clientPerson}>
              <PersonSelect
                value={form.clientPersonId || null}
                onChange={(v) => set("clientPersonId", v ?? "")}
              />
            </FormField>
            <FormField label={es.cases.assignedAttorney}>
              <Select value={form.assignedAttorneyId || "none"} onValueChange={(v) => set("assignedAttorneyId", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder={es.cases.assignedAttorney} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {(firmUsers ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.lastName}, {u.firstName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </section>

        {/* Sección: Económico */}
        <section>
          <h2 className="mb-4 text-lg font-medium border-b pb-2">{es.cases.sectionEconomic}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={es.cases.claimedAmount}>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.claimedAmount}
                onChange={(e) => set("claimedAmount", e.target.value)}
              />
            </FormField>
            <FormField label={es.cases.currency}>
              <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS (Pesos argentinos)</SelectItem>
                  <SelectItem value="USD">USD (Dólares estadounidenses)</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </section>

        {/* Sección: Portal */}
        <section>
          <h2 className="mb-4 text-lg font-medium border-b pb-2">{es.cases.sectionPortal}</h2>
          <FormField label={es.cases.portalUrl}>
            <Input
              type="url"
              value={form.portalUrl}
              onChange={(e) => set("portalUrl", e.target.value)}
              placeholder="https://"
            />
          </FormField>
        </section>

        {/* Sección: Observaciones */}
        <section>
          <h2 className="mb-4 text-lg font-medium border-b pb-2">{es.cases.sectionNotes}</h2>
          <FormField label={es.cases.notes}>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={4}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </FormField>
        </section>

        {/* Botones */}
        <div className="flex gap-3 border-t pt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {es.common.save}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(isEdit ? `/cases/${id}` : "/cases")}>
            {es.common.cancel}
          </Button>
        </div>
      </form>
    </div>
  );
}
