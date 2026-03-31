import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateEvent, useUpdateEvent } from "@/hooks/use-events";
import { es } from "@/i18n/es";
import { EventType } from "@/types";
import type { Event } from "@/types";
import { ApiError } from "@/services/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const EVENT_TYPE_LABELS: Record<string, string> = {
  HEARING: es.calendar.hearing,
  DEADLINE: es.calendar.deadline,
  MEETING: es.calendar.meeting,
  MEDIATION: es.calendar.mediation,
  COURT_VISIT: es.calendar.courtVisit,
  OTHER: es.calendar.other,
};

const eventSchema = z.object({
  eventType: z.nativeEnum(EventType),
  title: z.string().min(1, es.calendar.titleRequired),
  description: z.string().optional(),
  eventDate: z.string().min(1, es.calendar.dateRequired),
  eventTime: z.string().optional(),
  endTime: z.string().optional(),
  isAllDay: z.boolean(),
  caseId: z.string().optional(),
  matterId: z.string().optional(),
});

interface EventFormProps {
  open: boolean;
  onClose: () => void;
  event: Event | null;
}

interface FormState {
  eventType: EventType;
  title: string;
  description: string;
  eventDate: string;
  eventTime: string;
  endTime: string;
  isAllDay: boolean;
  caseId: string;
  matterId: string;
}

const emptyForm: FormState = {
  eventType: EventType.OTHER,
  title: "",
  description: "",
  eventDate: "",
  eventTime: "",
  endTime: "",
  isAllDay: false,
  caseId: "",
  matterId: "",
};

export function EventForm({ open, onClose, event }: EventFormProps) {
  const isEdit = !!event;
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      if (event) {
        setForm({
          eventType: event.eventType,
          title: event.title,
          description: event.description ?? "",
          eventDate: event.eventDate.slice(0, 10),
          eventTime: event.eventTime?.slice(0, 5) ?? "",
          endTime: event.endTime?.slice(0, 5) ?? "",
          isAllDay: event.isAllDay,
          caseId: event.caseId ?? "",
          matterId: event.matterId ?? "",
        });
      } else {
        setForm(emptyForm);
      }
      setErrors({});
    }
  }, [open, event]);

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = eventSchema.safeParse(form);
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
    // Clean empty strings to null
    for (const [k, v] of Object.entries(payload)) {
      if (v === "") payload[k] = null;
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: event!.id, data: payload });
        toast.success(es.calendar.updated);
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(es.calendar.created);
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
          <DialogTitle>{isEdit ? es.calendar.editEvent : es.calendar.newEvent}</DialogTitle>
          <DialogDescription>
            {isEdit ? es.calendar.editEventDescription : es.calendar.newEventDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={es.calendar.eventType} required>
            <Select value={form.eventType} onValueChange={(v) => set("eventType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(EventType).map((t) => (
                  <SelectItem key={t} value={t}>{EVENT_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={es.calendar.title_field} error={errors.title} required>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </FormField>

          <FormField label={es.calendar.description}>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={es.calendar.date} error={errors.eventDate} required>
              <Input type="date" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
            </FormField>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={form.isAllDay}
                  onChange={(e) => set("isAllDay", e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                {es.calendar.allDay}
              </label>
            </div>
          </div>

          {!form.isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <FormField label={es.calendar.startTime}>
                <Input type="time" value={form.eventTime} onChange={(e) => set("eventTime", e.target.value)} />
              </FormField>
              <FormField label={es.calendar.endTime}>
                <Input type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />
              </FormField>
            </div>
          )}

          <FormField label={es.calendar.linkToCase}>
            <Input
              value={form.caseId}
              onChange={(e) => set("caseId", e.target.value)}
              placeholder={es.calendar.selectCase}
            />
          </FormField>

          <FormField label={es.calendar.linkToMatter}>
            <Input
              value={form.matterId}
              onChange={(e) => set("matterId", e.target.value)}
              placeholder={es.calendar.selectMatter}
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
