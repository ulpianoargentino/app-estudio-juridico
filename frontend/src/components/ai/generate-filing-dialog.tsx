import { useState } from "react";
import { generateFiling } from "@/services/ai.service";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bot, Loader2, Copy, Check } from "lucide-react";

const filingTypes = [
  { value: "demanda", label: "Demanda" },
  { value: "contestacion", label: "Contestación de demanda" },
  { value: "recurso_apelacion", label: "Recurso de apelación" },
  { value: "recurso_revocatoria", label: "Recurso de revocatoria" },
  { value: "alegato", label: "Alegato" },
  { value: "cedula", label: "Cédula de notificación" },
  { value: "oficio", label: "Oficio" },
  { value: "mandamiento", label: "Mandamiento" },
  { value: "escrito_mero_tramite", label: "Escrito de mero trámite" },
  { value: "solicita_medida_cautelar", label: "Solicita medida cautelar" },
  { value: "ofrece_prueba", label: "Ofrece prueba" },
  { value: "impugna", label: "Impugna" },
  { value: "otro", label: "Otro" },
];

interface GenerateFilingDialogProps {
  open: boolean;
  onClose: () => void;
  caseId: string;
  caseTitle: string;
}

export function GenerateFilingDialog({
  open,
  onClose,
  caseId,
  caseTitle,
}: GenerateFilingDialogProps) {
  const [filingType, setFilingType] = useState("");
  const [instructions, setInstructions] = useState("");
  const [html, setHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (!filingType) return;
    setIsLoading(true);
    setError(null);
    setHtml(null);
    try {
      const result = await generateFiling({
        caseId,
        filingType: filingTypes.find((t) => t.value === filingType)?.label ?? filingType,
        instructions: instructions || undefined,
      });
      setHtml(result.html);
    } catch {
      setError(es.ai.errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopy() {
    if (!html) return;
    // Copy the plain text version
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    navigator.clipboard.writeText(tmp.textContent || tmp.innerText || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setFilingType("");
    setInstructions("");
    setHtml(null);
    setError(null);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {es.ai.generateFiling}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{caseTitle}</p>
        </DialogHeader>

        {!html ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{es.ai.filingType}</Label>
              <Select value={filingType} onValueChange={setFilingType}>
                <SelectTrigger>
                  <SelectValue placeholder={es.ai.selectFilingType} />
                </SelectTrigger>
                <SelectContent>
                  {filingTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{es.ai.additionalInstructions}</Label>
              <Input
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={es.ai.instructionsPlaceholder}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                {es.common.cancel}
              </Button>
              <Button onClick={handleGenerate} disabled={!filingType || isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Bot className="mr-2 h-4 w-4" />
                )}
                {isLoading ? es.ai.generating : es.ai.generate}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {copied ? es.ai.copied : es.ai.copyText}
              </Button>
            </div>

            <div
              className="prose prose-sm dark:prose-invert max-w-none rounded-md border border-border bg-muted/30 p-4"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setHtml(null)}>
                {es.ai.regenerate}
              </Button>
              <Button onClick={handleClose}>
                {es.common.close}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
