import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { es } from "@/i18n/es";

interface CasesEmptyStateProps {
  onCreate: () => void;
  message: string;
  showCreateButton: boolean;
}

export function CasesEmptyState({ onCreate, message, showCreateButton }: CasesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Briefcase className="h-6 w-6" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      {showCreateButton && (
        <Button onClick={onCreate} size="sm">
          <Plus className="h-4 w-4" />
          {es.cases.firstCaseButton}
        </Button>
      )}
    </div>
  );
}
