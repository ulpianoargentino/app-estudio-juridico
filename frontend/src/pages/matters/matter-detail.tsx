import { useParams, useNavigate } from "react-router-dom";
import { useMatter } from "@/hooks/use-matters";
import { es } from "@/i18n/es";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { DocumentsTab } from "@/components/shared/documents-tab";
import { EventsTab } from "@/components/shared/events-tab";
import { ArrowLeft, Loader2 } from "lucide-react";

const matterTypeLabels: Record<string, string> = {
  CONSULTATION: "Consulta",
  CONTRACT: "Contrato",
  NEGOTIATION: "Negociación",
  ADVISORY: "Asesoramiento",
  OPINION: "Dictamen",
  OTHER: "Otro",
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

export function MatterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: matter, isLoading } = useMatter(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!matter) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Caso no encontrado
      </div>
    );
  }

  const clientName = matter.primaryClient
    ? matter.primaryClient.businessName || `${matter.primaryClient.lastName}, ${matter.primaryClient.firstName}`
    : null;

  return (
    <div>
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/matters")}>
          <ArrowLeft className="h-4 w-4" />
          {es.common.back}
        </Button>
      </div>

      <PageHeader
        title={matter.title}
        description={matterTypeLabels[matter.matterType] ?? matter.matterType}
        action={<StatusBadge status={matter.status} />}
      />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{es.person.generalData}</TabsTrigger>
          <TabsTrigger value="parties">
            Partes ({matter.parties.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            {es.documents.title} ({matter.documentCount})
          </TabsTrigger>
          <TabsTrigger value="events">
            {es.calendar.title}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Título" value={matter.title} />
            <Field label="Tipo" value={matterTypeLabels[matter.matterType] ?? matter.matterType} />
            <Field label={es.matters.status} value={undefined} badge={<StatusBadge status={matter.status} />} />
            <Field label="Cliente principal" value={clientName} />
            <Field
              label="Abogado responsable"
              value={matter.responsibleAttorney ? `${matter.responsibleAttorney.lastName}, ${matter.responsibleAttorney.firstName}` : null}
            />
            <Field label="Fecha de inicio" value={matter.startDate ? new Date(matter.startDate).toLocaleDateString("es-AR") : null} />
            {matter.estimatedFee && (
              <Field label="Honorario estimado" value={`${matter.currency ?? "ARS"} ${Number(matter.estimatedFee).toLocaleString("es-AR")}`} />
            )}
            {matter.convertedToCaseId && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Convertido a expediente</p>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-sm"
                  onClick={() => navigate(`/cases/${matter.convertedToCaseId}`)}
                >
                  Ver expediente
                </Button>
              </div>
            )}
            {matter.notes && (
              <div className="sm:col-span-2 lg:col-span-3">
                <Field label="Notas" value={matter.notes} />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="parties">
          {matter.parties.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{es.common.noResults}</p>
          ) : (
            <div className="mt-4 space-y-2">
              {matter.parties.map((p) => (
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
          <DocumentsTab matterId={id} />
        </TabsContent>

        <TabsContent value="events">
          <EventsTab matterId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, value, badge }: { label: string; value?: string | null | undefined; badge?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {badge ? <div className="mt-0.5">{badge}</div> : <p className="mt-0.5 text-sm">{value || "—"}</p>}
    </div>
  );
}
