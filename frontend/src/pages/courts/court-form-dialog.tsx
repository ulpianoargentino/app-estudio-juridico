import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useCreateCourt } from "@/hooks/queries/courts";
import {
  courtCreateSchema,
  type Court,
  type CourtCreateInput,
} from "@shared";
import { toast } from "sonner";

type FormValues = {
  name: string;
  courtType: string;
  jurisdiction: string;
  address: string;
  phone: string;
  email: string;
  notes: string;
};

const emptyValues: FormValues = {
  name: "",
  courtType: "",
  jurisdiction: "",
  address: "",
  phone: "",
  email: "",
  notes: "",
};

function toOptional(v: string): string | undefined {
  const trimmed = v.trim();
  return trimmed === "" ? undefined : trimmed;
}

function valuesToInput(values: FormValues): CourtCreateInput {
  return {
    name: values.name.trim(),
    courtType: values.courtType.trim(),
    jurisdiction: values.jurisdiction.trim(),
    address: toOptional(values.address),
    phone: toOptional(values.phone),
    email: toOptional(values.email),
    notes: toOptional(values.notes),
  };
}

interface CourtFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (court: Court) => void;
}

export function CourtFormDialog({
  open,
  onOpenChange,
  onCreated,
}: CourtFormDialogProps) {
  const createMutation = useCreateCourt();
  const isSubmitting = createMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(courtCreateSchema) as never,
    defaultValues: emptyValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    if (open) form.reset(emptyValues);
  }, [open, form]);

  async function onSubmit(values: FormValues) {
    try {
      const created = await createMutation.mutateAsync(valuesToInput(values));
      toast.success(es.courts.toast.created);
      onCreated?.(created);
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : es.courts.toast.error;
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{es.courts.form.createTitle}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label={es.courts.form.name}
            required
            error={form.formState.errors.name?.message}
          >
            <Input {...form.register("name")} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={es.courts.form.courtType}
              required
              error={form.formState.errors.courtType?.message}
            >
              <Input
                placeholder={es.courts.form.courtTypePlaceholder}
                {...form.register("courtType")}
              />
            </FormField>
            <FormField
              label={es.courts.form.jurisdiction}
              required
              error={form.formState.errors.jurisdiction?.message}
            >
              <Input
                placeholder={es.courts.form.jurisdictionPlaceholder}
                {...form.register("jurisdiction")}
              />
            </FormField>
          </div>

          <FormField
            label={es.courts.form.address}
            error={form.formState.errors.address?.message}
          >
            <Input {...form.register("address")} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={es.courts.form.phone}
              error={form.formState.errors.phone?.message}
            >
              <Input {...form.register("phone")} />
            </FormField>
            <FormField
              label={es.courts.form.email}
              error={form.formState.errors.email?.message}
            >
              <Input type="email" {...form.register("email")} />
            </FormField>
          </div>

          <FormField
            label={es.courts.form.notes}
            error={form.formState.errors.notes?.message}
          >
            <Input {...form.register("notes")} />
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {es.courts.form.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {es.courts.form.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
