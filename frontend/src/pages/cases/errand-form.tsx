import { useEffect, useState } from "react";
import { toast } from "sonner";
import { es } from "@/i18n/es";
import { ApiError } from "@/services/api";
import { useCreateErrand, useUpdateErrand } from "@/hooks/use-errands";
import { useFirmUsers } from "@/hooks/use-case";
import type { Errand, ErrandType, ErrandStatus } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const ERRAND_TYPES: ErrandType[] = [
  "SERVICE_NOTICE" as ErrandType,
  "COURT_ORDER_WRIT" as ErrandType,
  "OFFICIAL_LETTER" as ErrandType,
  "ROGATORY_LETTER" as ErrandType,
  "OTHER" as ErrandType,
];

const ERRAND_STATUSES: ErrandStatus[] = [
  "PENDING" as ErrandStatus,
  "IN_PROGRESS" as ErrandStatus,
  "COMPLETED" as ErrandStatus,
  "FAILED" as ErrandStatus,
];

interface ErrandFormProps {
  open: boolean;
  onClose: () => void;
  caseId: string;
  errand: Errand | null;
}

interface FormState {
  errandType: string;
  status: string;
  assigneeId: string;
  dueAt: string;
  notes: string;
  createReminder: boolean;
}

const emptyForm: FormState = {
  errandType: "SERVICE_NOTICE",
  status: "PENDING",
  assigneeId: "",
  dueAt: "",
  notes: "",
  createReminder: false,
};

export function ErrandForm({ open, onClose, caseId, errand }: ErrandFormProps) {
  const isEdit = !!errand;
  const createMutation = useCreateErrand(caseId);
  const updateMutation = useUpdateErrand(caseId);
  const { data: users } = useFirmUsers();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      if (errand) {
        setForm({
          errandType: errand.errandType,
          status: errand.status,
          assigneeId: errand.assigneeId ?? "",
          dueAt: errand.dueAt ? errand.dueAt.slice(0, 10) : "",
          notes: errand.notes ?? "",
          createReminder: errand.createReminder,
        });
      } else {
        setForm(emptyForm);
      }
      setErrors({});
    }
  }, [open, errand]);

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const n = { ...prev };
      delete n[field];
      return n;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const fieldErrors: Record<string, string> = {};
    if (!form.errandType) fieldErrors.errandType = es.common.required;
    if (!form.status) fieldErrors.status = es.common.required;
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    const payload = {
      errandType: form.errandType,
      status: form.status,
      assigneeId: form.assigneeId || null,
      dueAt: form.dueAt || null,
      notes: form.notes.trim() || null,
      createReminder: form.createReminder,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: errand!.id, data: payload });
        toast.success(es.errands.updated);
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(es.errands.created);
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? es.errands.edit : es.errands.add}</DialogTitle>
          <DialogDescription>
            {isEdit ? es.errands.editDescription : es.errands.addDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label={es.errands.type} error={errors.errandType} required>
              <Select value={form.errandType} onValueChange={(v) => set("errandType", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ERRAND_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {es.errands.types[t as keyof typeof es.errands.types]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={es.errands.status} error={errors.status} required>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ERRAND_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {es.errands.statuses[s as keyof typeof es.errands.statuses]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label={es.errands.assignee}>
            <Select value={form.assigneeId} onValueChange={(v) => set("assigneeId", v)}>
              <SelectTrigger>
                <SelectValue placeholder={es.errands.assignee} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">—</SelectItem>
                {(users ?? []).map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={es.errands.dueDate}>
            <Input
              type="date"
              value={form.dueAt}
              onChange={(e) => set("dueAt", e.target.value)}
            />
          </FormField>

          <FormField label={es.errands.notes}>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </FormField>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.createReminder}
              onChange={(e) => set("createReminder", e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            {es.errands.createReminder}
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {es.common.cancel}
            </Button>
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
