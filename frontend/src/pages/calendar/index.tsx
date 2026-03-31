import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useEvents, useDeleteEvent } from "@/hooks/use-events";
import { es } from "@/i18n/es";
import { EventType } from "@/types";
import type { Event } from "@/types";
import { ApiError } from "@/services/api";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EventForm } from "./event-form";
import { Plus, ChevronLeft, ChevronRight, Clock, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// -- Date helpers --

const WEEKDAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
] as const;

function monthName(d: Date): string {
  return MONTH_NAMES[d.getMonth()] ?? "";
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function getMonthGridDates(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const start = getMonday(firstDay);
  const dates: Date[] = [];
  for (let i = 0; i < 42; i++) {
    dates.push(addDays(start, i));
  }
  return dates;
}

function formatRangeLabel(view: ViewType, current: Date): string {
  if (view === "day") {
    return `${current.getDate()} de ${monthName(current)} de ${current.getFullYear()}`;
  }
  if (view === "week") {
    const monday = getMonday(current);
    const sunday = addDays(monday, 6);
    const startMonth = monthName(monday);
    const endMonth = monthName(sunday);
    if (monday.getMonth() === sunday.getMonth()) {
      return `${es.calendar.weekOf} ${monday.getDate()} ${es.calendar.to} ${sunday.getDate()} de ${startMonth} de ${monday.getFullYear()}`;
    }
    return `${es.calendar.weekOf} ${monday.getDate()} de ${startMonth} ${es.calendar.to} ${sunday.getDate()} de ${endMonth} de ${sunday.getFullYear()}`;
  }
  // month
  const mn = monthName(current);
  return `${mn.charAt(0).toUpperCase() + mn.slice(1)} ${current.getFullYear()}`;
}

// -- Event type colors --

const DEFAULT_EVENT_COLOR = { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" };

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  HEARING: { bg: "bg-red-500/10", text: "text-red-700 dark:text-red-400", border: "border-red-500/20" },
  DEADLINE: { bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", border: "border-amber-500/20" },
  MEETING: { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", border: "border-blue-500/20" },
  MEDIATION: { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-500/20" },
  COURT_VISIT: { bg: "bg-violet-500/10", text: "text-violet-700 dark:text-violet-400", border: "border-violet-500/20" },
  OTHER: DEFAULT_EVENT_COLOR,
};

function getEventColors(type: string) {
  return EVENT_TYPE_COLORS[type] ?? DEFAULT_EVENT_COLOR;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  HEARING: es.calendar.hearing,
  DEADLINE: es.calendar.deadline,
  MEETING: es.calendar.meeting,
  MEDIATION: es.calendar.mediation,
  COURT_VISIT: es.calendar.courtVisit,
  OTHER: es.calendar.other,
};

function EventTypeBadge({ type, className }: { type: string; className?: string }) {
  const colors = getEventColors(type);
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", colors.bg, colors.text, colors.border, className)}>
      {EVENT_TYPE_LABELS[type] ?? type}
    </span>
  );
}

// -- Types --

type ViewType = "day" | "week" | "month";

// -- Main component --

export function CalendarPage() {
  const [view, setView] = useState<ViewType>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");

  // Compute date range for API query
  const dateRange = useMemo(() => {
    if (view === "day") {
      const d = selectedDay ?? currentDate;
      return { startDate: formatDate(d), endDate: formatDate(d) };
    }
    if (view === "week") {
      const monday = getMonday(currentDate);
      return { startDate: formatDate(monday), endDate: formatDate(addDays(monday, 6)) };
    }
    // month: fetch the full grid range (may include days from prev/next month)
    const gridDates = getMonthGridDates(currentDate.getFullYear(), currentDate.getMonth());
    return { startDate: formatDate(gridDates[0]!), endDate: formatDate(gridDates[gridDates.length - 1]!) };
  }, [view, currentDate, selectedDay]);

  const filters = {
    ...dateRange,
    eventType: filterType !== "all" ? filterType : undefined,
    assignedToId: filterUser !== "all" ? filterUser : undefined,
  };

  const { data: events = [], isLoading } = useEvents(filters);
  const deleteMutation = useDeleteEvent();

  // Group events by date string for calendar rendering
  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    for (const ev of events) {
      const dateKey = ev.eventDate.slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(ev);
    }
    // Sort each day's events by time
    for (const key of Object.keys(map)) {
      map[key]!.sort((a, b) => (a.eventTime ?? "").localeCompare(b.eventTime ?? ""));
    }
    return map;
  }, [events]);

  // Navigation
  function navigate(direction: number) {
    const d = new Date(currentDate);
    if (view === "day") d.setDate(d.getDate() + direction);
    else if (view === "week") d.setDate(d.getDate() + direction * 7);
    else d.setMonth(d.getMonth() + direction);
    setCurrentDate(d);
    setSelectedDay(null);
  }

  function goToday() {
    setCurrentDate(new Date());
    setSelectedDay(null);
  }

  function handleNewEvent() {
    setEditEvent(null);
    setFormOpen(true);
  }

  function handleEditEvent(ev: Event) {
    setEditEvent(ev);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(es.calendar.deleted);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    }
    setDeleteTarget(null);
  }

  // Day events for detail view (day view or selected day in month)
  const dayDetailDate = view === "day" ? currentDate : selectedDay;
  const dayDetailEvents = dayDetailDate ? (eventsByDate[formatDate(dayDetailDate)] ?? []) : [];

  return (
    <div>
      <PageHeader
        title={es.calendar.title}
        action={
          <Button onClick={handleNewEvent}>
            <Plus className="h-4 w-4" />
            {es.calendar.newEvent}
          </Button>
        }
      />

      {/* Toolbar: view toggle + navigation + filters */}
      <div className="flex flex-col gap-4 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-lg border p-1">
            {(["day", "week", "month"] as const).map((v) => (
              <Button
                key={v}
                variant={view === v ? "default" : "ghost"}
                size="sm"
                onClick={() => { setView(v); setSelectedDay(null); }}
              >
                {v === "day" ? es.calendar.day : v === "week" ? es.calendar.week : es.calendar.month}
              </Button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday}>
              {es.calendar.today}
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="ml-2 text-sm font-medium">
              {formatRangeLabel(view, view === "day" && selectedDay ? selectedDay : currentDate)}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={es.calendar.eventType} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{es.calendar.allTypes}</SelectItem>
              {Object.values(EventType).map((t) => (
                <SelectItem key={t} value={t}>{EVENT_TYPE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={es.calendar.assignedTo} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{es.calendar.allUsers}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          {es.common.loading}
        </div>
      )}

      {/* Month view */}
      {!isLoading && view === "month" && (
        <MonthGrid
          currentDate={currentDate}
          eventsByDate={eventsByDate}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
      )}

      {/* Week view */}
      {!isLoading && view === "week" && (
        <WeekGrid
          currentDate={currentDate}
          eventsByDate={eventsByDate}
          onEditEvent={handleEditEvent}
          onDeleteEvent={setDeleteTarget}
        />
      )}

      {/* Day detail (for day view or selected day in month) */}
      {!isLoading && dayDetailDate && (
        <DayDetail
          date={dayDetailDate}
          events={dayDetailEvents}
          onEdit={handleEditEvent}
          onDelete={setDeleteTarget}
          showHeading={view === "month"}
        />
      )}

      {/* Day view with no events */}
      {!isLoading && view === "day" && dayDetailEvents.length === 0 && (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          {es.calendar.noEvents}
        </div>
      )}

      <EventForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditEvent(null); }}
        event={editEvent}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        title={es.calendar.deleteConfirmTitle}
        description={es.calendar.deleteConfirmDescription}
        confirmText={es.common.delete}
        variant="danger"
      />
    </div>
  );
}

// -- Month Grid --

function MonthGrid({
  currentDate,
  eventsByDate,
  selectedDay,
  onSelectDay,
}: {
  currentDate: Date;
  eventsByDate: Record<string, Event[]>;
  selectedDay: Date | null;
  onSelectDay: (d: Date) => void;
}) {
  const gridDates = getMonthGridDates(currentDate.getFullYear(), currentDate.getMonth());
  const currentMonth = currentDate.getMonth();

  return (
    <div className="rounded-lg border">
      {/* Header */}
      <div className="grid grid-cols-7 border-b">
        {WEEKDAY_NAMES.map((name) => (
          <div key={name} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
            {name}
          </div>
        ))}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7">
        {gridDates.map((date, i) => {
          const dateKey = formatDate(date);
          const dayEvents = eventsByDate[dateKey] ?? [];
          const isCurrentMonth = date.getMonth() === currentMonth;
          const isSelected = selectedDay && isSameDay(date, selectedDay);
          const isTodayDate = isToday(date);
          const maxVisible = 3;

          return (
            <div
              key={i}
              className={cn(
                "min-h-[100px] border-b border-r p-1 cursor-pointer transition-colors hover:bg-muted/50",
                !isCurrentMonth && "bg-muted/20",
                isSelected && "bg-accent/50",
              )}
              onClick={() => onSelectDay(date)}
            >
              <div className="flex justify-end">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    isTodayDate && "bg-primary text-primary-foreground font-bold",
                    !isCurrentMonth && !isTodayDate && "text-muted-foreground",
                  )}
                >
                  {date.getDate()}
                </span>
              </div>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, maxVisible).map((ev) => (
                  <EventChip key={ev.id} event={ev} />
                ))}
                {dayEvents.length > maxVisible && (
                  <span className="block text-xs text-muted-foreground px-1">
                    +{dayEvents.length - maxVisible} {es.calendar.moreEvents}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventChip({ event }: { event: Event }) {
  const colors = getEventColors(event.eventType);
  return (
    <div className={cn("truncate rounded px-1 py-0.5 text-[11px] leading-tight border", colors.bg, colors.text, colors.border)}>
      {event.eventTime && (
        <span className="font-medium">{event.eventTime.slice(0, 5)} </span>
      )}
      {event.title}
    </div>
  );
}

// -- Week Grid --

function WeekGrid({
  currentDate,
  eventsByDate,
  onEditEvent,
  onDeleteEvent,
}: {
  currentDate: Date;
  eventsByDate: Record<string, Event[]>;
  onEditEvent: (ev: Event) => void;
  onDeleteEvent: (ev: Event) => void;
}) {
  const monday = getMonday(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <div className="rounded-lg border">
      <div className="grid grid-cols-7">
        {days.map((date, i) => {
          const dateKey = formatDate(date);
          const dayEvents = eventsByDate[dateKey] ?? [];
          const isTodayDate = isToday(date);

          return (
            <div key={i} className={cn("border-r last:border-r-0 min-h-[200px]", isTodayDate && "bg-accent/20")}>
              {/* Day header */}
              <div className="border-b px-2 py-2 text-center">
                <div className="text-xs text-muted-foreground">{WEEKDAY_NAMES[i]}</div>
                <div className={cn(
                  "mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                  isTodayDate && "bg-primary text-primary-foreground",
                )}>
                  {date.getDate()}
                </div>
              </div>
              {/* Events */}
              <div className="space-y-1 p-1 max-h-[400px] overflow-y-auto">
                {dayEvents.map((ev) => (
                  <WeekEventBlock
                    key={ev.id}
                    event={ev}
                    onEdit={() => onEditEvent(ev)}
                    onDelete={() => onDeleteEvent(ev)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekEventBlock({
  event,
  onEdit,
  onDelete,
}: {
  event: Event;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const colors = getEventColors(event.eventType);
  return (
    <div className={cn("group rounded border p-1.5 text-xs cursor-pointer", colors.bg, colors.border)}>
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          {event.eventTime && (
            <div className={cn("flex items-center gap-1 font-medium", colors.text)}>
              <Clock className="h-3 w-3" />
              {event.eventTime.slice(0, 5)}
              {event.endTime && ` - ${event.endTime.slice(0, 5)}`}
            </div>
          )}
          <div className={cn("mt-0.5 font-medium truncate", colors.text)}>{event.title}</div>
          <EventTypeBadge type={event.eventType} className="mt-1" />
        </div>
        <div className="hidden group-hover:flex gap-0.5 shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="rounded p-0.5 hover:bg-background/80">
            <Pencil className="h-3 w-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="rounded p-0.5 hover:bg-background/80 text-destructive">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// -- Day Detail --

function DayDetail({
  date,
  events,
  onEdit,
  onDelete,
  showHeading,
}: {
  date: Date;
  events: Event[];
  onEdit: (ev: Event) => void;
  onDelete: (ev: Event) => void;
  showHeading: boolean;
}) {
  if (events.length === 0 && showHeading) {
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          {date.getDate()} de {monthName(date)} de {date.getFullYear()}
        </h3>
        <p className="text-sm text-muted-foreground">{es.calendar.noEvents}</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {showHeading && (
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          {date.getDate()} de {monthName(date)} de {date.getFullYear()}
        </h3>
      )}
      <div className="space-y-2">
        {events.map((ev) => (
          <DayEventCard key={ev.id} event={ev} onEdit={() => onEdit(ev)} onDelete={() => onDelete(ev)} />
        ))}
      </div>
    </div>
  );
}

function DayEventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: Event;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const colors = getEventColors(event.eventType);

  return (
    <div className={cn("rounded-lg border p-4", colors.bg, colors.border)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {event.eventTime && (
              <span className={cn("flex items-center gap-1 text-sm font-medium", colors.text)}>
                <Clock className="h-4 w-4" />
                {event.eventTime.slice(0, 5)}
                {event.endTime && ` - ${event.endTime.slice(0, 5)}`}
              </span>
            )}
            {event.isAllDay && (
              <span className="text-xs text-muted-foreground">{es.calendar.allDay}</span>
            )}
            <EventTypeBadge type={event.eventType} />
          </div>
          <h4 className="mt-1 font-medium">{event.title}</h4>
          {event.description && (
            <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {event.caseTitle && (
              <span>{es.calendar.linkedCase}: <span className="font-medium text-foreground">{event.caseTitle}</span></span>
            )}
            {event.matterTitle && (
              <span>{es.calendar.linkedMatter}: <span className="font-medium text-foreground">{event.matterTitle}</span></span>
            )}
            {event.assignedToName && (
              <span>{es.calendar.assignedTo}: <span className="font-medium text-foreground">{event.assignedToName}</span></span>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
