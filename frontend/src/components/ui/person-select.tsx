import { useState, useEffect, useRef } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "./command";
import { Button } from "./button";
import { es } from "@/i18n/es";
import { apiClient } from "@/services/api";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, Check, X } from "lucide-react";
import type { PersonSearchResult as PersonResult } from "@shared";

interface PersonSelectProps {
  value: string | null;
  onChange: (personId: string | null) => void;
  placeholder?: string;
  className?: string;
}

function formatPersonName(p: PersonResult): string {
  if (p.businessName) return p.businessName;
  return `${p.lastName}, ${p.firstName}`;
}

export function PersonSelect({ value, onChange, placeholder, className }: PersonSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonResult[]>([]);
  const [selected, setSelected] = useState<PersonResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
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

  return (
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
