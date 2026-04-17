import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { es } from "@/i18n/es";

interface PersonsEmptyStateProps {
  onCreate: () => void;
}

export function PersonsEmptyState({ onCreate }: PersonsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Users className="h-6 w-6" />
      </div>
      <p className="text-sm text-muted-foreground">{es.persons.emptyState}</p>
      <Button onClick={onCreate} size="sm">
        <Plus className="h-4 w-4" />
        {es.persons.firstPersonButton}
      </Button>
    </div>
  );
}
