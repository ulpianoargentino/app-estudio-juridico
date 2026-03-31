import { useParams, useNavigate } from "react-router-dom";
import { useCase } from "@/hooks/use-cases";
import { es } from "@/i18n/es";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { DocumentsTab } from "@/components/shared/documents-tab";
import { EventsTab } from "@/components/shared/events-tab";
import { ArrowLeft, Loader2 } from "lucide-react";

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
  const { data: caseData, isLoading } = useCase(id);

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
        Expediente no encontrado
      </div>
    );
  }

  const clientName = caseData.primaryClient
    ? caseData.primaryClient.businessName || `${caseData.primaryClient.lastName}, ${caseData.primaryClient.firstName}`
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
        action={<StatusBadge status={caseData.status} />}
      />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{es.person.generalData}</TabsTrigger>
          <TabsTrigger value="parties">
            Partes ({caseData.parties.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            {es.documents.title} ({caseData.documentCount})
          </TabsTrigger>
          <TabsTrigger value="events">
            {es.calendar.title} ({caseData.upcomingEventCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={es.cases.caseTitle} value={caseData.caseTitle} />
            <Field label={es.cases.caseNumber} value={caseData.caseNumber} />
            <Field label={es.cases.jurisdictionType} value={jurisdictionLabels[caseData.jurisdictionType] ?? caseData.jurisdictionType} />
            <Field label={es.cases.jurisdiction} value={caseData.jurisdiction} />
            <Field label={es.cases.court} value={caseData.court?.name} />
            <Field label={es.cases.clerkOffice} value={caseData.court?.clerkOffice} />
            <Field label="Cliente principal" value={clientName} />
            <Field
              label="Abogado responsable"
              value={caseData.responsibleAttorney ? `${caseData.responsibleAttorney.lastName}, ${caseData.responsibleAttorney.firstName}` : null}
            />
            <Field label="Fecha de inicio" value={caseData.startDate ? new Date(caseData.startDate).toLocaleDateString("es-AR") : null} />
            {caseData.notes && (
              <div className="sm:col-span-2 lg:col-span-3">
                <Field label="Notas" value={caseData.notes} />
              </div>
            )}
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
                  </div>
                  <StatusBadge status={p.role} label={roleLabels[p.role] ?? p.role} variant="info" />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab caseId={id} />
        </TabsContent>

        <TabsContent value="events">
          <EventsTab caseId={id} />
        </TabsContent>
      </Tabs>
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
