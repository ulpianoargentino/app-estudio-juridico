import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { PersonSelect } from "@/components/ui/person-select";
import { CourtSelect } from "@/components/ui/court-select";
import { es } from "@/i18n/es";
import { ApiError } from "@/services/api";
import { useCase, useCreateCase, useUpdateCase } from "@/hooks/queries/cases";
import {
  caseCreateSchema,
  caseStatus as caseStatusEnum,
  jurisdictionType as jurisdictionTypeEnum,
  type CaseCreateInput,
  type CaseDetail,
} from "@shared";
import { toast } from "sonner";

type CaseStatusKey = keyof typeof es.cases.status;
type JurisdictionTypeKey = keyof typeof es.cases.jurisdictionType;

type FormValues = {
  caseTitle: string;
  caseNumber: string;
  jurisdictionType: "" | CaseCreateInput["jurisdictionType"];
  jurisdiction: string;
  courtId: string | null;
  processType: string;
  status: CaseCreateInput["status"];
  primaryClientId: string | null;
  startDate: string; // yyyy-MM-dd
  claimedAmount: string;
  currency: "" | "ARS" | "USD";
  portalUrl: string;
  notes: string;
};

const emptyValues: FormValues = {
  caseTitle: "",
  caseNumber: "",
  jurisdictionType: "",
  jurisdiction: "",
  courtId: null,
  processType: "",
  status: caseStatusEnum.INITIAL,
  primaryClientId: null,
  startDate: "",
  claimedAmount: "",
  currency: "",
  portalUrl: "",
  notes: "",
};

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  // ISO -> yyyy-MM-dd usando fecha local del navegador. Aceptable para inputs.
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function caseToValues(c: CaseDetail): FormValues {
  return {
    caseTitle: c.caseTitle,
    caseNumber: c.caseNumber ?? "",
    jurisdictionType: c.jurisdictionType,
    jurisdiction: c.jurisdiction ?? "",
    courtId: c.courtId,
    processType: c.processType ?? "",
    status: c.status,
    primaryClientId: c.primaryClientId,
    startDate: toDateInputValue(c.startDate),
    claimedAmount: c.claimedAmount ?? "",
    currency: (c.currency as FormValues["currency"]) ?? "",
    portalUrl: c.portalUrl ?? "",
    notes: c.notes ?? "",
  };
}

function toOptional(v: string): string | undefined {
  const t = v.trim();
  return t === "" ? undefined : t;
}

function valuesToInput(values: FormValues): CaseCreateInput {
  return {
    caseTitle: values.caseTitle.trim(),
    caseNumber: toOptional(values.caseNumber),
    jurisdictionType: values.jurisdictionType as CaseCreateInput["jurisdictionType"],
    jurisdiction: toOptional(values.jurisdiction),
    courtId: values.courtId ?? undefined,
    processType: toOptional(values.processType),
    status: values.status,
    primaryClientId: values.primaryClientId ?? undefined,
    // z.coerce.date() acepta strings YYYY-MM-DD. Dejamos al schema la coerción.
    startDate: values.startDate ? (new Date(values.startDate) as never) : undefined,
    claimedAmount: toOptional(values.claimedAmount),
    currency: values.currency === "" ? undefined : values.currency,
    portalUrl: toOptional(values.portalUrl),
    notes: toOptional(values.notes),
  };
}

export function CaseFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const detailQuery = useCase(id);
  const createMutation = useCreateCase();
  const updateMutation = useUpdateCase();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(caseCreateSchema) as never,
    defaultValues: emptyValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    if (isEdit && detailQuery.data) {
      form.reset(caseToValues(detailQuery.data));
    } else if (!isEdit) {
      form.reset(emptyValues);
    }
  }, [isEdit, detailQuery.data, form]);

  async function onSubmit(values: FormValues) {
    if (!values.jurisdictionType) {
      form.setError("jurisdictionType", {
        message: es.cases.validation.jurisdictionTypeRequired,
      });
      return;
    }
    const input = valuesToInput(values);
    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, input });
        toast.success(es.cases.toast.updated);
        navigate(`/cases/${id}`);
      } else {
        const created = await createMutation.mutateAsync(input);
        toast.success(es.cases.toast.created);
        navigate(`/cases/${created.id}`);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : es.cases.toast.error;
      toast.error(message);
    }
  }

  function handleCancel() {
    if (isEdit && id) {
      navigate(`/cases/${id}`);
    } else {
      navigate("/cases");
    }
  }

  if (isEdit && detailQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isEdit && detailQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">{es.cases.detail.loadError}</p>
        <Button variant="outline" onClick={() => navigate("/cases")}>
          {es.cases.backToList}
        </Button>
      </div>
    );
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
        <PageHeader
          title={isEdit ? es.cases.form.editTitle : es.cases.form.createTitle}
        />
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-3xl space-y-8"
      >
        {/* Identificación */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {es.cases.form.sections.identification}
          </h2>
          <FormField
            label={es.cases.form.caseTitle}
            required
            error={form.formState.errors.caseTitle?.message}
          >
            <Input
              placeholder={es.cases.form.caseTitlePlaceholder}
              {...form.register("caseTitle")}
            />
          </FormField>
          <FormField
            label={es.cases.form.caseNumber}
            error={form.formState.errors.caseNumber?.message}
          >
            <Input {...form.register("caseNumber")} />
          </FormField>
        </section>

        {/* Clasificación */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {es.cases.form.sections.classification}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={es.cases.form.jurisdictionType}
              required
              error={form.formState.errors.jurisdictionType?.message}
            >
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                {...form.register("jurisdictionType")}
              >
                <option value="">—</option>
                {Object.values(jurisdictionTypeEnum).map((v) => (
                  <option key={v} value={v}>
                    {es.cases.jurisdictionType[v as JurisdictionTypeKey]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              label={es.cases.form.jurisdiction}
              error={form.formState.errors.jurisdiction?.message}
            >
              <Input
                placeholder={es.cases.form.jurisdictionPlaceholder}
                {...form.register("jurisdiction")}
              />
            </FormField>
          </div>

          <FormField label={es.cases.form.court}>
            <Controller
              name="courtId"
              control={form.control}
              render={({ field }) => (
                <CourtSelect
                  value={field.value}
                  onChange={field.onChange}
                  allowCreate
                />
              )}
            />
          </FormField>

          <FormField
            label={es.cases.form.processType}
            error={form.formState.errors.processType?.message}
          >
            <Input
              placeholder={es.cases.form.processTypePlaceholder}
              {...form.register("processType")}
            />
          </FormField>
        </section>

        {/* Estado y fechas */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {es.cases.form.sections.state}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={es.cases.form.status}
              error={form.formState.errors.status?.message}
            >
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                {...form.register("status")}
              >
                {Object.values(caseStatusEnum).map((v) => (
                  <option key={v} value={v}>
                    {es.cases.status[v as CaseStatusKey]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              label={es.cases.form.startDate}
              error={form.formState.errors.startDate?.message}
            >
              <Input type="date" {...form.register("startDate")} />
            </FormField>
          </div>
        </section>

        {/* Cliente principal */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {es.cases.form.sections.client}
          </h2>
          <FormField label={es.cases.form.primaryClient}>
            <Controller
              name="primaryClientId"
              control={form.control}
              render={({ field }) => (
                <PersonSelect
                  value={field.value}
                  onChange={field.onChange}
                  allowCreate
                />
              )}
            />
          </FormField>
        </section>

        {/* Montos */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {es.cases.form.sections.amounts}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={es.cases.form.claimedAmount}
              error={form.formState.errors.claimedAmount?.message}
            >
              <Input
                type="number"
                min="0"
                step="0.01"
                {...form.register("claimedAmount")}
              />
            </FormField>
            <FormField
              label={es.cases.form.currency}
              error={form.formState.errors.currency?.message}
            >
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                {...form.register("currency")}
              >
                <option value="">—</option>
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </FormField>
          </div>
        </section>

        {/* Adicional */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {es.cases.form.sections.additional}
          </h2>
          <FormField
            label={es.cases.form.portalUrl}
            error={form.formState.errors.portalUrl?.message}
          >
            <Input
              type="url"
              placeholder={es.cases.form.portalUrlPlaceholder}
              {...form.register("portalUrl")}
            />
          </FormField>
          <FormField
            label={es.cases.form.notes}
            error={form.formState.errors.notes?.message}
          >
            <Input {...form.register("notes")} />
          </FormField>
        </section>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {es.cases.form.cancel}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {es.cases.form.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
