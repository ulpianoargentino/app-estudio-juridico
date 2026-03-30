import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { usePerson, useDeletePerson } from "@/hooks/use-persons";
import { es } from "@/i18n/es";
import { ApiError } from "@/services/api";
import type { Person } from "@/services/person.service";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { PersonForm } from "./person-form";
import { Pencil, Trash2, ArrowLeft, Loader2 } from "lucide-react";

// Mapeo de roles a español
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

export function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: person, isLoading } = usePerson(id);
  const deleteMutation = useDeletePerson();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        {es.person.notFound}
      </div>
    );
  }

  const displayName = person.businessName || `${person.firstName} ${person.lastName}`;
  const typeLabel = person.personType === "INDIVIDUAL" ? es.person.individual : es.person.legalEntity;

  const caseParties = person.parties.filter((p) => p.caseId);
  const matterParties = person.parties.filter((p) => p.matterId);

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(person!.id);
      toast.success(es.person.deleted);
      navigate("/persons");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    }
    setDeleteOpen(false);
  }

  return (
    <div>
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/persons")}>
          <ArrowLeft className="h-4 w-4" />
          {es.common.back}
        </Button>
      </div>

      <PageHeader
        title={displayName}
        description={typeLabel}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setFormOpen(true)}>
              <Pencil className="h-4 w-4" />
              {es.common.edit}
            </Button>
            <Button variant="outline" className="text-destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              {es.common.delete}
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{es.person.generalData}</TabsTrigger>
          <TabsTrigger value="cases">
            {es.cases.title} ({caseParties.length})
          </TabsTrigger>
          <TabsTrigger value="matters">
            {es.matters.title} ({matterParties.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {person.personType === "INDIVIDUAL" && (
              <>
                <Field label={es.person.firstName} value={person.firstName} />
                <Field label={es.person.lastName} value={person.lastName} />
              </>
            )}
            {person.businessName && <Field label={es.person.businessName} value={person.businessName} />}
            <Field label={es.person.cuit} value={person.cuitCuil} />
            <Field label={es.person.email} value={person.email} />
            <Field label={es.person.phone} value={person.phone} />
            <Field label={es.person.mobile} value={person.mobilePhone} />
            <Field label={es.person.addressStreet} value={person.addressStreet} />
            <Field label={es.person.addressCity} value={person.addressCity} />
            <Field label={es.person.addressState} value={person.addressState} />
            <Field label={es.person.addressZip} value={person.addressZip} />
            <Field label={es.person.legalAddress} value={person.legalAddress} />
            <Field label={es.person.appointedAddress} value={person.appointedAddress} />
            {person.notes && (
              <div className="sm:col-span-2 lg:col-span-3">
                <Field label={es.person.notes} value={person.notes} />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="cases">
          {caseParties.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{es.common.noResults}</p>
          ) : (
            <div className="mt-4 space-y-2">
              {caseParties.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/cases/${p.caseId}`)}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.caseTitle}</p>
                    {p.caseNumber && <p className="text-xs text-muted-foreground">{p.caseNumber}</p>}
                  </div>
                  <StatusBadge status={p.role} label={roleLabels[p.role] ?? p.role} variant="info" />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="matters">
          {matterParties.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{es.common.noResults}</p>
          ) : (
            <div className="mt-4 space-y-2">
              {matterParties.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/matters/${p.matterId}`)}
                >
                  <p className="truncate text-sm font-medium">{p.matterTitle}</p>
                  <StatusBadge status={p.role} label={roleLabels[p.role] ?? p.role} variant="info" />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PersonForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        person={person as unknown as Person}
      />

      <ConfirmDialog
        open={deleteOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        title={es.person.deleteConfirmTitle}
        description={es.person.deleteConfirmDescription}
        confirmText={es.common.delete}
        variant="danger"
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
