import { useState } from "react";
import { toast } from "sonner";
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/use-events";
import { es } from "@/i18n/es";
import { ApiError } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Loader2,
  Calendar,
  Clock,
} from "lucide-react";
import type { Event } from "@/types";

const eventTypeLabels: Record<string, string> = {
  HEARING: es.calendar.hearing,
  DEADLINE: es.calendar.deadline,
  MEETING: es.calendar.meeting,
  MEDIATION: es.calendar.mediation,
  COURT_VISIT: es.calendar.courtVisit,
  OTHER: es.calendar.other,
};

const eventTypeVariants: Record<string, "info" | "danger" | "warning" | "success" | "neutral" | "default"> = {
  HEARING: "danger",
  DEADLINE: "warning",
  MEETING: "info",
  MEDIATION: "success",
  COURT_VISIT: "neutral",
  OTHER: "default",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isPast(dateStr: string): boolean {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate < today;
}

interface EventsTabProps {
  caseId?: string;
  matterId?: string;
}

interface EventFormData {
  eventType: string;
  title: string;
  description: string;
  eventDate: string;
  eventTime: string;
  isAllDay: boolean;
  assignedToId: string;
}

const emptyForm: EventFormData = {
  eventType: "",
  title: "",
  description: "",
  eventDate: "",
  eventTime: "",
  isAllDay: false,
  assignedToId: "",
};

export function EventsTab({ caseId, matterId }: EventsTabProps) {
  const { data, isLoading } = useEvents({ caseId, matterId, limit: 100, sort: "event_date", order: "asc" });
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormData>(emptyForm);

  const events = data?.data ?? [];

  function openCreate() {
    setEditingEvent(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(event: Event) {
    setEditingEvent(event);
    setForm({
      eventType: event.eventType,
      title: event.title,
      description: event.description ?? "",
      eventDate: event.eventDate ? event.eventDate.slice(0, 10) : "",
      eventTime: event.eventTime ?? "",
      isAllDay: event.isAllDay,
      assignedToId: event.assignedToId ?? "",
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingEvent(null);
    setForm(emptyForm);
  }

  async function handleSubmit() {
    if (!form.eventType || !form.title || !form.eventDate) return;

    try {
      if (editingEvent) {
        await updateMutation.mutateAsync({
          id: editingEvent.id,
          data: {
            eventType: form.eventType,
            title: form.title,
            description: form.description || null,
            eventDate: form.eventDate,
            eventTime: form.isAllDay ? null : (form.eventTime || null),
            isAllDay: form.isAllDay,
            assignedToId: form.assignedToId || null,
          },
        });
        toast.success(es.calendar.updated);
      } else {
        await createMutation.mutateAsync({
          caseId: caseId ?? null,
          matterId: matterId ?? null,
          eventType: form.eventType,
          title: form.title,
          description: form.description || null,
          eventDate: form.eventDate,
          eventTime: form.isAllDay ? null : (form.eventTime || null),
          isAllDay: form.isAllDay,
          assignedToId: form.assignedToId || null,
        });
        toast.success(es.calendar.created);
      }
      closeForm();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    }
  }

  async function handleMarkCompleted(event: Event) {
    try {
      await updateMutation.mutateAsync({
        id: event.id,
        data: { status: "COMPLETED" },
      });
      toast.success(es.calendar.updated);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success(es.calendar.deleted);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    }
    setDeleteId(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {events.length} {events.length === 1 ? "evento" : "eventos"}
        </h3>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          {es.calendar.addEvent}
        </Button>
      </div>

      {events.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{es.common.noResults}</p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => {
            const pastAndPending = isPast(event.eventDate) && event.status === "PENDING";
            const isCompleted = event.status === "COMPLETED";

            return (
              <div
                key={event.id}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                  pastAndPending
                    ? "border-amber-500/30 bg-amber-500/5"
                    : isCompleted
                      ? "opacity-60"
                      : "hover:bg-muted/50"
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`truncate text-sm font-medium ${isCompleted ? "line-through" : ""}`}>
                      {event.title}
                    </p>
                    {pastAndPending && (
                      <StatusBadge status="overdue" label={es.calendar.pastOverdue} variant="warning" />
                    )}
                    {isCompleted && (
                      <StatusBadge status="COMPLETED" label={es.calendar.completed} variant="success" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(event.eventDate)}</span>
                    {!event.isAllDay && event.eventTime && (
                      <>
                        <Clock className="h-3 w-3" />
                        <span>{event.eventTime}</span>
                      </>
                    )}
                    {event.isAllDay && <span>{es.calendar.allDay}</span>}
                    {event.assigneeName && (
                      <>
                        <span>&middot;</span>
                        <span>{event.assigneeName}</span>
                      </>
                    )}
                  </div>
                </div>
                <StatusBadge
                  status={event.eventType}
                  label={eventTypeLabels[event.eventType] ?? event.eventType}
                  variant={eventTypeVariants[event.eventType] ?? "default"}
                />
                <div className="flex items-center gap-1">
                  {event.status === "PENDING" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-emerald-600"
                      onClick={() => handleMarkCompleted(event)}
                      title={es.calendar.markCompleted}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => openEdit(event)}
                    title={es.common.edit}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive"
                    onClick={() => setDeleteId(event.id)}
                    title={es.common.delete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={formOpen} onOpenChange={(v) => { if (!v) closeForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? es.calendar.editEvent : es.calendar.newEvent}
            </DialogTitle>
            <DialogDescription>
              {editingEvent ? es.calendar.editEventDescription : es.calendar.newEventDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <FormField label={es.calendar.eventType} required>
              <Select value={form.eventType} onValueChange={(v) => setForm((f) => ({ ...f, eventType: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={es.calendar.eventType} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(eventTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label={es.calendar.eventTitle} required>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={es.calendar.eventTitle}
              />
            </FormField>

            <FormField label={es.calendar.description}>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={es.calendar.description}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label={es.calendar.startDate} required>
                <Input
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
                />
              </FormField>
              {!form.isAllDay && (
                <FormField label={es.calendar.startTime}>
                  <Input
                    type="time"
                    value={form.eventTime}
                    onChange={(e) => setForm((f) => ({ ...f, eventTime: e.target.value }))}
                  />
                </FormField>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="rounded border-input"
                checked={form.isAllDay}
                onChange={(e) => setForm((f) => ({ ...f, isAllDay: e.target.checked, eventTime: "" }))}
              />
              {es.calendar.allDay}
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>
              {es.common.cancel}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.eventType || !form.title || !form.eventDate || createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              {es.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title={es.calendar.deleteConfirmTitle}
        description={es.calendar.deleteConfirmDescription}
        confirmText={es.common.delete}
        variant="danger"
      />
    </div>
  );
}
