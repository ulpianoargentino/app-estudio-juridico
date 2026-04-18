import { useState, useEffect, useRef } from "react";
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
import { PersonFormDialog } from "@/pages/persons/person-form-dialog";
import { es } from "@/i18n/es";
import { apiClient } from "@/services/api";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, Check, X, Plus } from "lucide-react";
import type { PersonSearchResult as PersonResult, Person } from "@shared";

interface PersonSelectProps {
  value: string | null;
  onChange: (personId: string | null) => void;
  placeholder?: string;
  className?: string;
  // Cuando es true, muestra una acción "Crear nueva persona" dentro del popover
  // que abre el PersonFormDialog. Por defecto false para no romper los usos
  // existentes del selector como componente puro de búsqueda.
  allowCreate?: boolean;
}

function formatPersonName(p: PersonResult | Person): string {
  if (p.businessName) return p.businessName;
  return `${p.lastName}, ${p.firstName}`;
}

export function PersonSelect({
  value,
  onChange,
  placeholder,
  className,
  allowCreate = false,
}: PersonSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonResult[]>([]);
  const [selected, setSelected] = useState<PersonResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch selected person data on mount if value is set
  useEffect(() => {
    if (value && !selected) {
      apiClient.get<PersonResult>(`/persons/${value}`)
        .then((res) => setSelected(res.data))
        .catch(() => {});
    }
    if (!value) setSelected(null);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await apiClient.get<PersonResult[]>(`/persons/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  function handleSelect(person: PersonResult) {
    setSelected(person);
    onChange(person.id);
    setOpen(false);
    setQuery("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    setSelected(null);
    onChange(null);
  }

  function handleOpenCreate() {
    setOpen(false);
    setCreateDialogOpen(true);
  }

  function handleCreated(person: Person) {
    // Mapeamos Person -> PersonSearchResult para mostrar en el trigger.
    const asResult: PersonResult = {
      id: person.id,
      personType: person.personType,
      firstName: person.firstName,
      lastName: person.lastName,
      businessName: person.businessName,
      cuitCuil: person.cuitCuil,
    };
    setSelected(asResult);
    onChange(person.id);
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
            className={cn("w-full justify-between font-normal", !selected && "text-muted-foreground", className)}
          >
            <span className="truncate">
              {selected ? formatPersonName(selected) : (placeholder ?? es.personSelect.placeholder)}
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
              placeholder={es.personSelect.searchPlaceholder}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>
                {isSearching ? es.common.loading : es.common.noResults}
              </CommandEmpty>
              {results.map((person) => (
                <CommandItem
                  key={person.id}
                  value={person.id}
                  onSelect={() => handleSelect(person)}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === person.id ? "opacity-100" : "opacity-0")} />
                  <div className="min-w-0">
                    <p className="truncate text-sm">{formatPersonName(person)}</p>
                    {person.cuitCuil && (
                      <p className="truncate text-xs text-muted-foreground">{person.cuitCuil}</p>
                    )}
                  </div>
                </CommandItem>
              ))}
              {allowCreate && (
                <>
                  <CommandSeparator />
                  <CommandItem
                    value="__create_person__"
                    onSelect={handleOpenCreate}
                    className="text-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {es.personSelect.createNew}
                  </CommandItem>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {allowCreate && (
        <PersonFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
