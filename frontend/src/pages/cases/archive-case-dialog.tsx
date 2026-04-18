import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useArchiveCase, useUnarchiveCase } from "@/hooks/queries/cases";
import { ApiError } from "@/services/api";
import { es } from "@/i18n/es";
import { toast } from "sonner";
import type { CaseListItem } from "@shared";

interface ArchiveCaseDialogProps {
  caseItem: CaseListItem | null;
  mode: "archive" | "unarchive";
  onClose: () => void;
  onDone?: () => void;
}

export function ArchiveCaseDialog({
  caseItem,
  mode,
  onClose,
  onDone,
}: ArchiveCaseDialogProps) {
  const archiveMutation = useArchiveCase();
  const unarchiveMutation = useUnarchiveCase();

  async function handleConfirm() {
    if (!caseItem) return;
    try {
      if (mode === "archive") {
        await archiveMutation.mutateAsync(caseItem.id);
        toast.success(es.cases.toast.archived);
      } else {
        await unarchiveMutation.mutateAsync(caseItem.id);
        toast.success(es.cases.toast.unarchived);
      }
      onDone?.();
      onClose();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : es.cases.toast.error;
      toast.error(message);
    }
  }

  const copy = mode === "archive" ? es.cases.archive : es.cases.unarchive;
  const body = caseItem
    ? copy.body.replace("{title}", caseItem.caseTitle)
    : "";

  return (
    <ConfirmDialog
      open={caseItem !== null}
      onConfirm={handleConfirm}
      onCancel={onClose}
      title={copy.title}
      description={body}
      confirmText={copy.confirm}
      cancelText={copy.cancel}
      variant={mode === "archive" ? "danger" : "default"}
    />
  );
}
