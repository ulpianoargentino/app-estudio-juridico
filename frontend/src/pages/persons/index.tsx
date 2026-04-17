import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { usePersons } from "@/hooks/queries/persons";
import { es } from "@/i18n/es";
import type { Person } from "@shared";
import { PersonsTable } from "./persons-table";
import { PersonsEmptyState } from "./persons-empty-state";
import { PersonFormDialog } from "./person-form-dialog";
import { DeletePersonDialog } from "./delete-person-dialog";

export function PersonsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [deletingPerson, setDeletingPerson] = useState<Person | null>(null);

  const { data = [], isLoading, isError, refetch } = usePersons();
  const hasData = data.length > 0;

  function openCreate() {
    setEditingPerson(null);
    setFormOpen(true);
  }

  function openEdit(person: Person) {
    setEditingPerson(person);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingPerson(null);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={es.persons.title}
        action={
          hasData && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {es.persons.newButton}
            </Button>
          )
        }
      />

      {isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">{es.persons.loadError}</p>
          <Button variant="outline" onClick={() => refetch()}>
            {es.persons.retry}
          </Button>
        </div>
      ) : !isLoading && !hasData ? (
        <PersonsEmptyState onCreate={openCreate} />
      ) : (
        <PersonsTable
          data={data}
          isLoading={isLoading}
          onRowClick={openEdit}
          onDeleteClick={setDeletingPerson}
        />
      )}

      <PersonFormDialog
        open={formOpen}
        onOpenChange={(next) => (next ? setFormOpen(true) : closeForm())}
        person={editingPerson}
      />

      <DeletePersonDialog
        person={deletingPerson}
        onClose={() => setDeletingPerson(null)}
      />
    </div>
  );
}
