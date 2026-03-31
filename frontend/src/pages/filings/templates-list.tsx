import { es } from "@/i18n/es";

export function TemplatesListPage() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="text-lg font-medium">{es.filings.templates}</h2>
      <p className="mt-2 text-muted-foreground">{es.common.comingSoon}</p>
    </div>
  );
}
