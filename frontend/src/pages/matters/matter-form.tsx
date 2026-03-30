import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateMatter, useUpdateMatter } from "@/hooks/use-matters";
import { es } from "@/i18n/es";
import { ApiError } from "@/services/api";
import type { Matter } from "@/services/matter.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PersonSelect } from "@/components/ui/person-select";
import { Loader2 } from "lucide-react";

const matterSchema = z.object({
  title: z.string().min(1, es.matters.titleRequired),
  matterType: z.string().min(1, es.matters.matterTypeRequired),
  status: z.string().min(1),
  primaryClientId: z.string().nullish(),
  opposingPartyId: z.string().nullish(),
  responsibleAttorneyId: z.string().nullish(),
  startDate: z.string().optional(),
  estimatedFee: z.string().optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
});

interface MatterFormProps {
  open: boolean;
  onClose: () => void;
  matter: Matter | null;
}

interface FormState {
  title: string;
  matterType: string;
  status: string;
  primaryClientId: string | null;
  opposingPartyId: string | null;
  responsibleAttorneyId: string;
  startDate: string;
  estimatedFee: string;
  currency: string;
  notes: string;
}

const emptyForm: FormState = {
  title: "",
  matterType: "CONSULTATION",
  status: "ACTIVE",
  primaryClientId: null,
  opposingPartyId: null,
  responsibleAttorneyId: "",
  startDate: "",
  estimatedFee: "",
  currency: "ARS",
  notes: "",
};

export function MatterForm({ open, onClose, matter }: MatterFormProps) {
  const isEdit = !!matter;
  const createMutation = useCreateMatter();
  const updateMutation = useUpdateMatter();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      if (matter) {
        setForm({
          title: matter.title,
          matterType: matter.matterType,
          status: matter.status,
          primaryClientId: matter.primaryClientId,
          opposingPartyId: matter.opposingPartyId,
          responsibleAttorneyId: matter.responsibleAttorneyId ?? "",
          startDate: matter.startDate ? matter.startDate.split("T")[0] : "",
          estimatedFee: matter.estimatedFee ?? "",
          currency: matter.currency ?? "ARS",
          notes: matter.notes ?? "",
        });
      } else {
        setForm(emptyForm);
      }
      setErrors({});
    }
  }, [open, matter]);

  function set(field: string, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = matterSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    const payload: Record<string, unknown> = { ...result.data };
    for (const [k, v] of Object.entries(payload)) {
      if (v === "") payload[k] = null;
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: matter!.id, data: payload });
        toast.success(es.matters.updated);
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(es.matters.created);
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? es.matters.edit : es.matters.new}</DialogTitle>
          <DialogDescription>
            {isEdit ? es.matters.editDescription : es.matters.newDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={es.matters.matterTitle} error={errors.title} required>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={es.matters.matterType} error={errors.matterType} required>
              <Select value={form.matterType} onValueChange={(v) => set("matterType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONSULTATION">{es.matters.type.consultation}</SelectItem>
                  <SelectItem value="CONTRACT">{es.matters.type.contract}</SelectItem>
                  <SelectItem value="NEGOTIATION">{es.matters.type.negotiation}</SelectItem>
                  <SelectItem value="ADVISORY">{es.matters.type.advisory}</SelectItem>
                  <SelectItem value="OPINION">{es.matters.type.opinion}</SelectItem>
                  <SelectItem value="OTHER">{es.matters.type.other}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label={es.matters.status}>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">{es.matters.statusLabel.active}</SelectItem>
                  <SelectItem value="ON_HOLD">{es.matters.statusLabel.onHold}</SelectItem>
                  <SelectItem value="COMPLETED">{es.matters.statusLabel.completed}</SelectItem>
                  <SelectItem value="ARCHIVED">{es.matters.statusLabel.archived}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={es.matters.client}>
              <PersonSelect
                value={form.primaryClientId}
                onChange={(v) => set("primaryClientId", v)}
              />
            </FormField>

            <FormField label={es.matters.opposingParty}>
              <PersonSelect
                value={form.opposingPartyId}
                onChange={(v) => set("opposingPartyId", v)}
              />
            </FormField>
          </div>

          <FormField label={es.matters.responsibleAttorney}>
            <Input
              value={form.responsibleAttorneyId}
              onChange={(e) => set("responsibleAttorneyId", e.target.value)}
              placeholder="ID del abogado responsable"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label={es.matters.startDate}>
              <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </FormField>

            <FormField label={es.matters.estimatedFee}>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.estimatedFee}
                onChange={(e) => set("estimatedFee", e.target.value)}
              />
            </FormField>

            <FormField label={es.matters.currency}>
              <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label={es.matters.notes}>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{es.common.cancel}</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {es.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
