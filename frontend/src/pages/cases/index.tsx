import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCases } from "@/hooks/queries/cases";
import { es } from "@/i18n/es";
import type { CaseListItem } from "@shared";
import { CasesTable } from "./cases-table";
import { CasesEmptyState } from "./cases-empty-state";
import { ArchiveCaseDialog } from "./archive-case-dialog";

type TabValue = "active" | "archived";

function tabToIsActive(tab: TabValue): boolean {
  return tab === "active";
}

export function CasesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: TabValue = searchParams.get("tab") === "archived" ? "archived" : "active";

  const [archiving, setArchiving] = useState<CaseListItem | null>(null);
  const [unarchiving, setUnarchiving] = useState<CaseListItem | null>(null);

  const { data = [], isLoading, isError, refetch } = useCases(tabToIsActive(tab));
  const hasData = data.length > 0;

  function openCreate() {
    navigate("/cases/new");
  }

  function openDetail(row: CaseListItem) {
    navigate(`/cases/${row.id}`);
  }

  function handleTabChange(next: string) {
    const nextParams = new URLSearchParams(searchParams);
    if (next === "active") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", "archived");
    }
    setSearchParams(nextParams, { replace: true });
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={es.cases.title}
        action={
          tab === "active" && hasData ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {es.cases.newButton}
            </Button>
          ) : null
        }
      />

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="active">{es.cases.tabs.active}</TabsTrigger>
          <TabsTrigger value="archived">{es.cases.tabs.archived}</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {isError ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">{es.cases.loadError}</p>
              <Button variant="outline" onClick={() => refetch()}>
                {es.cases.retry}
              </Button>
            </div>
          ) : !isLoading && !hasData ? (
            <CasesEmptyState
              onCreate={openCreate}
              message={es.cases.emptyStateActive}
              showCreateButton
            />
          ) : (
            <CasesTable
              data={data}
              isLoading={isLoading}
              showArchived={false}
              onRowClick={openDetail}
              onArchiveClick={setArchiving}
            />
          )}
        </TabsContent>

        <TabsContent value="archived">
          {isError ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">{es.cases.loadError}</p>
              <Button variant="outline" onClick={() => refetch()}>
                {es.cases.retry}
              </Button>
            </div>
          ) : !isLoading && !hasData ? (
            <CasesEmptyState
              onCreate={openCreate}
              message={es.cases.emptyStateArchived}
              showCreateButton={false}
            />
          ) : (
            <CasesTable
              data={data}
              isLoading={isLoading}
              showArchived
              onRowClick={openDetail}
              onUnarchiveClick={setUnarchiving}
            />
          )}
        </TabsContent>
      </Tabs>

      <ArchiveCaseDialog
        caseItem={archiving}
        mode="archive"
        onClose={() => setArchiving(null)}
      />
      <ArchiveCaseDialog
        caseItem={unarchiving}
        mode="unarchive"
        onClose={() => setUnarchiving(null)}
      />
    </div>
  );
}
