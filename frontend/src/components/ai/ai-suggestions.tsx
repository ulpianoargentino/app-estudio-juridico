import { useState } from "react";
import { suggestNextSteps, type Suggestion } from "@/services/ai.service";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Loader2, Lightbulb } from "lucide-react";

const priorityConfig = {
  alta: { label: "Alta", className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" },
  media: { label: "Media", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  baja: { label: "Baja", className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
};

interface AISuggestionsProps {
  caseId: string;
}

export function AISuggestions({ caseId }: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGetSuggestions() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await suggestNextSteps(caseId);
      setSuggestions(result.suggestions);
    } catch {
      setError(es.ai.errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h3 className="text-base font-semibold">{es.ai.suggestionsTitle}</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGetSuggestions}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Bot className="mr-2 h-4 w-4" />
          )}
          {isLoading ? es.ai.thinking : es.ai.getSuggestions}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {suggestions === null && !isLoading && !error && (
        <p className="text-sm text-muted-foreground">
          {es.ai.suggestionsEmpty}
        </p>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {suggestions.map((s, i) => {
            const prio = priorityConfig[s.priority] ?? priorityConfig.media;
            return (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
                    <span className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-xs font-medium ${prio.className}`}>
                      {prio.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                  {s.deadline && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">{es.ai.suggestionDeadline}:</span> {s.deadline}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
