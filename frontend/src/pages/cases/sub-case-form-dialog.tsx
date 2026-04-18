import { useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { es } from "@/i18n/es";
import { ApiError } from "@/services/api";
import {
  useCreateSubCase,
  useNextSubCaseNumber,
} from "@/hooks/queries/cases";
import {
  subCaseType as subCaseTypeEnum,
  type CaseDetail,
  type SubCaseCreateInput,
} from "@shared";
import { toast } from "sonner";

// Modelo flexible: tipo y número son opcionales. La carátula del sub default
// a la del padre pero se puede editar — útil para incidentes ("Incidente de
// embargo preventivo s/ caso principal", etc.).
type FormValues = {
  subCaseType: "" | "EVIDENCE" | "INCIDENT" | "OTHER";
  subCaseNumber: string;
  caseTitle: string;
  subCaseDescription: string;
  notes: string;
};

interface SubCaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parent: CaseDetail;
}

export function SubCaseFormDialog({
  open,
  onOpenChange,
  parent,
}: SubCaseFormDialogProps) {
  const createMutation = useCreateSubCase(parent.id);

  const initialValues: FormValues = {
    subCaseType: "",
    subCaseNumber: "",
    caseTitle: parent.caseTitle, // default: heredada del padre, editable
    subCaseDescription: "",
    notes: "",
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: initialValues,
  });

  // Reseteo cuando se reabre el diálogo, asegurando que la carátula vuelva
  // al default del padre (que puede haber cambiado entre aperturas).
  useEffect(() => {
    if (open) reset(initialValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, parent.caseTitle, reset]);

  // Observa el tipo seleccionado para pedirle al backend la sugerencia del
  // próximo número. Sólo dispara cuando hay tipo (el hook tiene `enabled`).
  const watchedType = useWatch({ control, name: "subCaseType" });
  const { data: suggestion } = useNextSubCaseNumber(
    parent.id,
    watchedType || undefined
  );
  const numberPlaceholder = watchedType && suggestion
    ? suggestion.suggested
    : es.cases.subCases.form.numberHelpNoType;

  // Datos heredados que mostramos como readonly (juzgado, cliente, número del
  // padre). La carátula NO va acá porque ahora es un campo editable arriba.
  const inheritedClient = parent.primaryClient
    ? parent.primaryClient.businessName ??
      `${parent.primaryClient.lastName}, ${parent.primaryClient.firstName}`
    : "—";
  const inheritedCourt = parent.court?.name ?? "—";

  async function onSubmit(values: FormValues) {
    // Modelo flexible: todos los campos son opcionales. Strings vacíos van a
    // null para que el backend no guarde "".
    const payload: SubCaseCreateInput = {
      subCaseType: values.subCaseType || null,
      subCaseNumber: values.subCaseNumber.trim() || null,
      caseTitle: values.caseTitle.trim() || null,
      subCaseDescription: values.subCaseDescription.trim() || null,
      notes: values.notes.trim() || null,
    };
    try {
      await createMutation.mutateAsync(payload);
      toast.success(es.cases.subCases.toast.created);
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : es.cases.subCases.toast.error;
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{es.cases.subCases.form.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label={es.cases.subCases.form.type}
            error={errors.subCaseType?.message}
          >
            <Controller
              name="subCaseType"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">{es.cases.subCases.form.typeNone}</option>
                  <option value={subCaseTypeEnum.EVIDENCE}>
                    {es.cases.subCases.type.EVIDENCE}
                  </option>
                  <option value={subCaseTypeEnum.INCIDENT}>
                    {es.cases.subCases.type.INCIDENT}
                  </option>
                  <option value={subCaseTypeEnum.OTHER}>
                    {es.cases.subCases.type.OTHER}
                  </option>
                </select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              {es.cases.subCases.form.typeHelp}
            </p>
          </FormField>

          <FormField
            label={es.cases.subCases.form.number}
            error={errors.subCaseNumber?.message}
          >
            <Controller
              name="subCaseNumber"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder={numberPlaceholder} />
              )}
            />
          </FormField>

          <FormField
            label={es.cases.subCases.form.caseTitle}
            error={errors.caseTitle?.message}
          >
            <Controller
              name="caseTitle"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
            <p className="text-xs text-muted-foreground">
              {es.cases.subCases.form.caseTitleHelp}
            </p>
          </FormField>

          <FormField
            label={es.cases.subCases.form.description}
            error={errors.subCaseDescription?.message}
          >
            <Controller
              name="subCaseDescription"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder={es.cases.subCases.form.descriptionPlaceholder}
                />
              )}
            />
          </FormField>

          <FormField
            label={es.cases.subCases.form.notes}
            error={errors.notes?.message}
          >
            <Controller
              name="notes"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </FormField>

          <div className="rounded-md border bg-muted/40 p-3 text-xs">
            <p className="mb-2 font-medium">
              {es.cases.subCases.form.inheritedTitle}
            </p>
            <dl className="space-y-1 text-muted-foreground">
              <div className="flex gap-2">
                <dt className="font-medium">
                  {es.cases.subCases.form.inheritedCaseNumber}:
                </dt>
                <dd>{parent.caseNumber ?? "—"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium">
                  {es.cases.subCases.form.inheritedCourt}:
                </dt>
                <dd>{inheritedCourt}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium">
                  {es.cases.subCases.form.inheritedClient}:
                </dt>
                <dd>{inheritedClient}</dd>
              </div>
            </dl>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {es.cases.subCases.form.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {es.cases.subCases.form.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
