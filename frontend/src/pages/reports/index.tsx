import { es } from "@/i18n/es";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CasesReport } from "./cases-report";
import { DeadlinesReport } from "./deadlines-report";
import { ErrandsReport } from "./errands-report";

export function ReportsPage() {
  return (
    <div>
      <PageHeader title={es.reports.title} />

      <Tabs defaultValue="cases">
        <TabsList>
          <TabsTrigger value="cases">{es.reports.casesTab}</TabsTrigger>
          <TabsTrigger value="deadlines">{es.reports.deadlinesTab}</TabsTrigger>
          <TabsTrigger value="errands">{es.reports.errandsTab}</TabsTrigger>
        </TabsList>

        <TabsContent value="cases">
          <CasesReport />
        </TabsContent>

        <TabsContent value="deadlines">
          <DeadlinesReport />
        </TabsContent>

        <TabsContent value="errands">
          <ErrandsReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
