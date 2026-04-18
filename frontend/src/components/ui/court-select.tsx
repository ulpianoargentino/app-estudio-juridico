import { useState, useMemo } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
  CommandSeparator,
} from "./command";
import { Button } from "./button";
import { CourtFormDialog } from "@/pages/courts/court-form-dialog";
import { es } from "@/i18n/es";
import { useCourts } from "@/hooks/queries/courts";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, Check, X, Plus } from "lucide-react";
import type { Court } from "@shared";

interface CourtSelectProps {
  value: string | null;
  onChange: (courtId: string | null) => void;
  placeholder?: string;
  className?: string;
  // Cuando es true, muestra una acción "Crear nuevo juzgado" dentro del popover
  // que abre el CourtFormDialog. Por defecto false.
  allowCreate?: boolean;
}

function matches(court: Court, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    court.name.toLowerCase().includes(q) ||
    court.jurisdiction.toLowerCase().includes(q) ||
    court.courtType.toLowerCase().includes(q)
  );
}

export function CourtSelect({
  value,
  onChange,
  placeholder,
  className,
  allowCreate = false,
}: CourtSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: courts, isLoading } = useCourts();

  const selected = useMemo(
    () => courts?.find((c) => c.id === value) ?? null,
    [courts, value]
  );
  const filtered = useMemo(
    () => (courts ?? []).filter((c) => matches(c, query)),
    [courts, query]
  );

  function handleSelect(court: Court) {
    onChange(court.id);
    setOpen(false);
    setQuery("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
  }

  function handleOpenCreate() {
    setOpen(false);
    setCreateDialogOpen(true);
  }

  function handleCreated(court: Court) {
    onChange(court.id);
    setCreateDialogOpen(false);
    setQuery("");
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal",
              !selected && "text-muted-foreground",
              className
            )}
          >
            <span className="truncate">
              {selected ? selected.name : (placeholder ?? es.courtSelect.placeholder)}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {selected && (
                <span onClick={handleClear} className="hover:text-foreground">
                  <X className="h-3 w-3" />
                </span>
              )}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={es.courtSelect.searchPlaceholder}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? es.common.loading : es.common.noResults}
              </CommandEmpty>
              {filtered.map((court) => (
                <CommandItem
                  key={court.id}
                  value={court.id}
                  onSelect={() => handleSelect(court)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === court.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm">{court.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {court.courtType} — {court.jurisdiction}
                    </p>
                  </div>
                </CommandItem>
              ))}
              {allowCreate && (
                <>
                  <CommandSeparator />
                  <CommandItem
                    value="__create_court__"
                    onSelect={handleOpenCreate}
                    className="text-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {es.courtSelect.createNew}
                  </CommandItem>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {allowCreate && (
        <CourtFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
