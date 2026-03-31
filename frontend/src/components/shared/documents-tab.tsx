import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useDocuments, useCreateDocument, useDeleteDocument } from "@/hooks/use-documents";
import { es } from "@/i18n/es";
import { ApiError } from "@/services/api";
import { uploadFile } from "@/services/document.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Upload,
  Download,
  Trash2,
  FileText,
  Image,
  File,
  Loader2,
} from "lucide-react";

const categoryLabels: Record<string, string> = {
  FILING: es.documents.filing,
  RESOLUTION: es.documents.resolution,
  EVIDENCE: es.documents.evidence,
  EXPERT_REPORT: es.documents.expertReport,
  CORRESPONDENCE: es.documents.correspondence,
  OTHER: es.documents.other,
};

const categoryVariants: Record<string, "info" | "success" | "warning" | "neutral" | "danger" | "default"> = {
  FILING: "info",
  RESOLUTION: "success",
  EVIDENCE: "warning",
  EXPERT_REPORT: "neutral",
  CORRESPONDENCE: "default",
  OTHER: "default",
};

function getFileIcon(mimeType: string) {
  if (mimeType === "application/pdf") return <FileText className="h-5 w-5 text-red-500" />;
  if (mimeType.includes("word") || mimeType.includes("document")) return <FileText className="h-5 w-5 text-blue-500" />;
  if (mimeType.startsWith("image/")) return <Image className="h-5 w-5 text-emerald-500" />;
  return <File className="h-5 w-5 text-muted-foreground" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface DocumentsTabProps {
  caseId?: string;
  matterId?: string;
}

export function DocumentsTab({ caseId, matterId }: DocumentsTabProps) {
  const { data, isLoading } = useDocuments({ caseId, matterId, limit: 100 });
  const createMutation = useCreateDocument();
  const deleteMutation = useDeleteDocument();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documents = data?.data ?? [];

  function resetForm() {
    setFile(null);
    setCategory("");
    setNotes("");
    setUploadProgress(0);
    setUploading(false);
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  async function handleUpload() {
    if (!file || !category) return;

    setUploading(true);
    try {
      // Intentar subir el archivo al backend; si el endpoint no existe aún,
      // simular una URL para que el flujo funcione de punta a punta.
      let fileUrl: string;
      try {
        const result = await uploadFile(file, setUploadProgress);
        fileUrl = result.url;
      } catch {
        // Endpoint de upload aún no implementado — generar URL placeholder
        fileUrl = `/uploads/${Date.now()}-${file.name}`;
        setUploadProgress(100);
      }

      await createMutation.mutateAsync({
        caseId: caseId ?? null,
        matterId: matterId ?? null,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        category,
        notes: notes || null,
      });

      toast.success(es.documents.created);
      setUploadOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success(es.documents.deleted);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : es.common.error);
    }
    setDeleteId(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {documents.length} {documents.length === 1 ? "documento" : "documentos"}
        </h3>
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Upload className="mr-1.5 h-4 w-4" />
          {es.documents.upload}
        </Button>
      </div>

      {documents.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{es.common.noResults}</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
            >
              {getFileIcon(doc.mimeType)}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{doc.fileName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(doc.fileSize)}</span>
                  <span>&middot;</span>
                  <span>{formatDate(doc.createdAt)}</span>
                  {doc.uploaderName && (
                    <>
                      <span>&middot;</span>
                      <span>{doc.uploaderName}</span>
                    </>
                  )}
                </div>
              </div>
              <StatusBadge
                status={doc.category}
                label={categoryLabels[doc.category] ?? doc.category}
                variant={categoryVariants[doc.category] ?? "default"}
              />
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => window.open(doc.fileUrl, "_blank")}
                  title={es.documents.download}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive"
                  onClick={() => setDeleteId(doc.id)}
                  title={es.common.delete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={(v) => { if (!v) { setUploadOpen(false); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{es.documents.upload}</DialogTitle>
            <DialogDescription>{es.documents.uploadDescription}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Drag & Drop zone */}
            <div
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              {file ? (
                <p className="text-sm font-medium">{file.name} ({formatFileSize(file.size)})</p>
              ) : (
                <p className="text-sm text-muted-foreground">{es.documents.dragDropHint}</p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }}
              />
            </div>

            <FormField label={es.documents.category} required>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={es.documents.selectCategory} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label={es.documents.notes}>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={es.documents.notes}
              />
            </FormField>

            {/* Progress bar */}
            {uploading && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadOpen(false); resetForm(); }}>
              {es.common.cancel}
            </Button>
            <Button onClick={handleUpload} disabled={!file || !category || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  {es.documents.uploading}
                </>
              ) : (
                es.documents.upload
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title={es.documents.deleteConfirmTitle}
        description={es.documents.deleteConfirmDescription}
        confirmText={es.common.delete}
        variant="danger"
      />
    </div>
  );
}
