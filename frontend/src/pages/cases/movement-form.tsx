import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { es } from "@/i18n/es";
import { ApiError } from "@/services/api";
import { useCreateMovement, useUpdateMovement } from "@/hooks/use-movements";
import type { Movement, MovementType } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2, Upload } from "lucide-react";

const MOVEMENT_TYPES: MovementType[] = [
  "COMPLAINT" as MovementType,
  "ANSWER" as MovementType,
  "RESOLUTION" as MovementType,
  "JUDGMENT" as MovementType,
  "NOTIFICATION" as MovementType,
  "HEARING" as MovementType,
  "OTHER" as MovementType,
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

interface MovementFormProps {
  open: boolean;
  onClose: () => void;
  caseId: string;
  movement: Movement | null;
}

interface FormState {
  movementType: string;
  title: string;
  description: string;
  occurredAt: string;
  volume: string;
  page: string;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm: FormState = {
  movementType: "OTHER",
  title: "",
  description: "",
  occurredAt: todayISO(),
  volume: "",
  page: "",
};

export function MovementForm({ open, onClose, caseId, movement }: MovementFormProps) {
  const isEdit = !!movement;
  const createMutation = useCreateMovement(caseId);
  const updateMutation = useUpdateMovement(caseId);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      if (movement) {
        setForm({
          movementType: movement.movementType,
          title: movement.title,
          description: movement.description ?? "",
          occurredAt: movement.occurredAt.slice(0, 10),
          volume: movement.volume ?? "",
          page: movement.page ?? "",
        });
      } else {
        setForm(emptyForm);
      }
      setErrors({});
      setFile(null);
    }
  }, [open, movement]);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const n = { ...prev };
      delete n[field];
      return n;
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    if (selected && selected.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, file: es.movements.attachmentHint }));
      setFile(null);
      return;
    }
    setErrors((prev) => {
      const n = { ...prev };
      delete n.file;
      return n;
    });
    setFile(selected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const fieldErrors: Record<string, string> = {};
    if (!form.title.trim()) fieldErrors.title = es.common.required;
    if (!form.occurredAt) fieldErrors.occurredAt = es.common.required;
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    const payload = {
      movementType: form.movementType,
      title: form.title.trim(),
      description: form.description.trim() || null,
      occurredAt: form.occurredAt,
      volume: form.volume.trim() || null,
      page: form.page.trim() || null,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: movement!.id, data: payload });
        toast.success(es.movements.updated);
      } else {
        await createMutation.mutateAsync({ data: payload, file: file ?? undefined });
        toast.success(es.movements.created);
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
          <DialogTitle>{isEdit ? es.movements.edit : es.movements.add}</DialogTitle>
          <DialogDescription>
            {isEdit ? es.movements.editDescription : es.movements.addDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label={es.movements.date} error={errors.occurredAt} required>
              <Input
                type="date"
                value={form.occurredAt}
                onChange={(e) => set("occurredAt", e.target.value)}
              />
            </FormField>
            <FormField label={es.movements.type} required>
              <Select value={form.movementType} onValueChange={(v) => set("movementType", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOVEMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {es.movements.types[t as keyof typeof es.movements.types]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label={es.movements.types[form.movementType as keyof typeof es.movements.types] || es.movements.type} error={errors.title} required>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={es.movements.types[form.movementType as keyof typeof es.movements.types]}
            />
          </FormField>

          <FormField label={es.movements.description}>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={es.movements.volume}>
              <Input
                value={form.volume}
                onChange={(e) => set("volume", e.target.value)}
                placeholder={es.cases.volume}
              />
            </FormField>
            <FormField label={es.movements.page}>
              <Input
                value={form.page}
                onChange={(e) => set("page", e.target.value)}
                placeholder={es.cases.page}
              />
            </FormField>
          </div>

          {!isEdit && (
            <FormField label={es.movements.attachment} error={errors.file}>
              <div
                className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-input px-3 py-2 text-sm text-muted-foreground hover:border-ring transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                <span>{file ? file.name : es.movements.attachmentHint}</span>
              </div>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </FormField>
          )}

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
