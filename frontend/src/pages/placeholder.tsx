import { es } from "@/i18n/es";

type PageKey = "cases" | "matters" | "people" | "calendar" | "filings" | "reports" | "settings";

const titleMap: Record<PageKey, string> = {
  cases: es.cases.title,
  matters: es.matters.title,
  people: es.people.title,
  calendar: es.calendar.title,
  filings: es.nav.filings,
  reports: es.nav.reports,
  settings: es.nav.settings,
};

export function PlaceholderPage({ title }: { title: PageKey }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-2xl font-semibold">{titleMap[title]}</h1>
      <p className="mt-2 text-muted-foreground">{es.common.comingSoon}</p>
    </div>
  );
}
