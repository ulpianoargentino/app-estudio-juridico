import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCase } from "@/services/case.service";
import { es } from "@/i18n/es";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { CaseChatButton } from "@/components/ai/case-chat-button";
import { AISuggestions } from "@/components/ai/ai-suggestions";
import { GenerateFilingDialog } from "@/components/ai/generate-filing-dialog";
import { ArrowLeft, Loader2, FileText, Users, Activity, Calendar } from "lucide-react";

const jurisdictionLabels: Record<string, string> = {
  CIVIL_COMMERCIAL: "Civil y Comercial",
  LABOR: "Laboral",
  CRIMINAL: "Penal",
  FAMILY: "Familia",
  ADMINISTRATIVE: "Contencioso Administrativo",
  COLLECTIONS: "Cobros y Apremios",
  PROBATE: "Sucesiones",
  EXTRAJUDICIAL: "Extrajudicial",
};

const roleLabels: Record<string, string> = {
  PLAINTIFF: "Actor",
  DEFENDANT: "Demandado",
  ATTORNEY: "Abogado",
  PROCESS_SERVER: "Procurador",
  EXPERT_WITNESS: "Perito",
  WITNESS: "Testigo",
  JUDGE: "Juez",
  CLERK: "Secretario",
  CLIENT: "Cliente",
  OPPOSING_PARTY: "Contraparte",
};

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [filingDialogOpen, setFilingDialogOpen] = useState(false);

  const { data: caseData, isLoading } = useQuery({
    queryKey: ["case", id],
    queryFn: () => getCase(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        {es.caseDetail.notFound}
      </div>
    );
  }

  const clientName = caseData.primaryClient
    ? caseData.primaryClient.businessName ||
      `${caseData.primaryClient.lastName}, ${caseData.primaryClient.firstName}`
    : null;

  const attorneyName = caseData.responsibleAttorney
    ? `${caseData.responsibleAttorney.lastName}, ${caseData.responsibleAttorney.firstName}`
    : null;

  return (
    <div>
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/cases")}>
          <ArrowLeft className="h-4 w-4" />
          {es.common.back}
        </Button>
      </div>

      <PageHeader
        title={caseData.caseTitle}
        description={caseData.caseNumber ?? undefined}
        action={
          <div className="flex flex-wrap gap-2">
            <CaseChatButton
              caseId={caseData.id}
              contextLabel={caseData.caseTitle}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilingDialogOpen(true)}
            >
              <FileText className="mr-2 h-4 w-4" />
              {es.ai.generateFiling}
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <StatusBadge status={caseData.status} />
        <span className="text-sm text-muted-foreground">
          {jurisdictionLabels[caseData.jurisdictionType] ?? caseData.jurisdictionType}
        </span>
      </div>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">{es.caseDetail.summary}</TabsTrigger>
          <TabsTrigger value="parties">
            <Users className="mr-1 h-3.5 w-3.5" />
            {es.caseDetail.parties} ({caseData.parties.length})
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="mr-1 h-3.5 w-3.5" />
            {es.caseDetail.activity} ({caseData.movementCount})
          </TabsTrigger>
          <TabsTrigger value="ai">
            {es.ai.suggestionsTitle}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={es.cases.caseTitle} value={caseData.caseTitle} />
            <Field label={es.cases.caseNumber} value={caseData.caseNumber} />
            <Field label={es.cases.jurisdictionType} value={jurisdictionLabels[caseData.jurisdictionType]} />
            <Field label={es.cases.jurisdiction} value={caseData.jurisdiction} />
            <Field label={es.cases.court} value={caseData.court?.name} />
            {caseData.court?.clerkOffice && (
              <Field label={es.cases.clerkOffice} value={caseData.court.clerkOffice} />
            )}
            <Field label={es.caseDetail.processType} value={caseData.processType} />
            <Field label={es.caseDetail.client} value={clientName} />
            <Field label={es.caseDetail.attorney} value={attorneyName} />
            {caseData.startDate && (
              <Field
                label={es.caseDetail.startDate}
                value={new Date(caseData.startDate).toLocaleDateString("es-AR")}
              />
            )}
            {caseData.claimedAmount && (
              <Field
                label={es.caseDetail.claimedAmount}
                value={`${caseData.currency ?? "ARS"} ${Number(caseData.claimedAmount).toLocaleString("es-AR")}`}
              />
            )}
            {caseData.notes && (
              <div className="sm:col-span-2 lg:col-span-3">
                <Field label={es.caseDetail.notes} value={caseData.notes} />
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <StatCard icon={<Activity className="h-4 w-4" />} label={es.caseDetail.movements} value={caseData.movementCount} />
            <StatCard icon={<FileText className="h-4 w-4" />} label={es.caseDetail.documents} value={caseData.documentCount} />
            <StatCard icon={<Calendar className="h-4 w-4" />} label={es.caseDetail.upcomingEvents} value={caseData.upcomingEventCount} />
          </div>
        </TabsContent>

        <TabsContent value="parties">
          {caseData.parties.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{es.common.noResults}</p>
          ) : (
            <div className="mt-4 space-y-2">
              {caseData.parties.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/persons/${p.personId}`)}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {p.businessName || `${p.lastName}, ${p.firstName}`}
                    </p>
                    {p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
                  </div>
                  <StatusBadge status={p.role} label={roleLabels[p.role] ?? p.role} variant="info" />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity">
          <p className="py-8 text-center text-sm text-muted-foreground">
            {es.common.comingSoon}
          </p>
        </TabsContent>

        <TabsContent value="ai">
          <div className="mt-4">
            <AISuggestions caseId={caseData.id} />
          </div>
        </TabsContent>
      </Tabs>

      <GenerateFilingDialog
        open={filingDialogOpen}
        onClose={() => setFilingDialogOpen(false)}
        caseId={caseData.id}
        caseTitle={caseData.caseTitle}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value || "—"}</p>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-lg font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
