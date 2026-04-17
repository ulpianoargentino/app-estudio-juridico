import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDeletePerson } from "@/hooks/queries/persons";
import { ApiError } from "@/services/api";
import { es } from "@/i18n/es";
import { toast } from "sonner";
import type { Person } from "@shared";
import { formatPersonName } from "./persons-table";

interface DeletePersonDialogProps {
  person: Person | null;
  onClose: () => void;
}

export function DeletePersonDialog({ person, onClose }: DeletePersonDialogProps) {
  const deleteMutation = useDeletePerson();

  async function handleConfirm() {
    if (!person) return;
    try {
      await deleteMutation.mutateAsync(person.id);
      toast.success(es.persons.toast.deleted);
      onClose();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : es.persons.toast.error;
      toast.error(message);
    }
  }

  const body = person
    ? es.persons.confirmDelete.body.replace("{name}", formatPersonName(person))
    : "";

  return (
    <ConfirmDialog
      open={person !== null}
      onConfirm={handleConfirm}
      onCancel={onClose}
      title={es.persons.confirmDelete.title}
      description={body}
      confirmText={es.persons.confirmDelete.confirm}
      cancelText={es.persons.confirmDelete.cancel}
      variant="danger"
    />
  );
}
