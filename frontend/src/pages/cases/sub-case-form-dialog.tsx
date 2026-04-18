import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { useCreateSubCase } from "@/hooks/queries/cases";
import {
  subCaseType as subCaseTypeEnum,
  type CaseDetail,
  type SubCaseCreateInput,
} from "@shared";
import { toast } from "sonner";

type FormValues = {
  subCaseType: "" | "PLAINTIFF" | "DEFENDANT" | "OTHER";
  subCaseDescription: string;
  notes: string;
};

const emptyValues: FormValues = {
  subCaseType: "",
  subCaseDescription: "",
  notes: "",
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

  // Validación a mano: el único campo obligatorio es subCaseType (un select).
  // Usar zodResolver acá fuerza al tipo del form a no admitir "" como placeholder
  // del select, lo que vuelve incómodo el defaultValue. Con un solo campo
  // requerido alcanza con una validación inline en onSubmit.
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open) reset(emptyValues);
  }, [open, reset]);

  // Datos heredados que mostramos como readonly al usuario, para que entienda
  // qué se va a copiar del padre al hijo (juzgado, cliente, carátula, número).
  const inheritedClient = parent.primaryClient
    ? parent.primaryClient.businessName ??
      `${parent.primaryClient.lastName}, ${parent.primaryClient.firstName}`
    : "—";
  const inheritedCourt = parent.court?.name ?? "—";

  async function onSubmit(values: FormValues) {
    if (!values.subCaseType) {
      setError("subCaseType", {
        message: es.cases.subCases.validation.typeRequired,
      });
      return;
    }
    const payload: SubCaseCreateInput = {
      subCaseType: values.subCaseType,
      subCaseDescription: values.subCaseDescription.trim() || undefined,
      notes: values.notes.trim() || undefined,
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
            required
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
                  <option value="">—</option>
                  <option value={subCaseTypeEnum.PLAINTIFF}>
                    {es.cases.subCases.type.PLAINTIFF}
                  </option>
                  <option value={subCaseTypeEnum.DEFENDANT}>
                    {es.cases.subCases.type.DEFENDANT}
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
                  {es.cases.subCases.form.inheritedCaseTitle}:
                </dt>
                <dd className="line-clamp-2">{parent.caseTitle}</dd>
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
