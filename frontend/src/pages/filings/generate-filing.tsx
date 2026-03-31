import { useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { toast } from "sonner";
import { es } from "@/i18n/es";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Save,
  Search,
  Bold,
  Italic,
  UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo,
  Redo,
} from "lucide-react";
import * as filingService from "@/services/filing.service";

type Step = 1 | 2 | 3;

export function GenerateFilingPage() {
  const [step, setStep] = useState<Step>(1);
  const [cases, setCases] = useState<filingService.CaseListItem[]>([]);
  const [templates, setTemplates] = useState<filingService.Template[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [filingTitle, setFilingTitle] = useState("");
  const [caseSearch, setCaseSearch] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loadingCases, setLoadingCases] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[400px] p-6 focus:outline-none font-serif leading-relaxed",
      },
    },
  });

  // Load cases on step 1
  const loadCases = useCallback(async (search?: string) => {
    setLoadingCases(true);
    try {
      const data = await filingService.getCases({ search });
      setCases(data);
    } catch {
      toast.error(es.common.error);
    } finally {
      setLoadingCases(false);
    }
  }, []);

  // Load templates on step 2
  const loadTemplates = useCallback(async (search?: string, category?: string) => {
    setLoadingTemplates(true);
    try {
      const data = await filingService.getTemplates({
        search: search || undefined,
        category: category || undefined,
      });
      setTemplates(data);
    } catch {
      toast.error(es.common.error);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  // Enter step 1 — load cases
  const goToStep1 = useCallback(() => {
    setStep(1);
    loadCases();
  }, [loadCases]);

  // Enter step 2 — load templates
  const goToStep2 = useCallback(() => {
    if (!selectedCaseId) return;
    setStep(2);
    loadTemplates();
  }, [selectedCaseId, loadTemplates]);

  // Generate: render template with case data, load into editor
  const handleGenerate = useCallback(async () => {
    if (!selectedCaseId || !selectedTemplateId) return;
    setGenerating(true);
    try {
      const result = await filingService.renderTemplate(selectedTemplateId, selectedCaseId);
      editor?.commands.setContent(result.html);
      if (!filingTitle) {
        setFilingTitle(result.templateName);
      }
      setStep(3);
    } catch {
      toast.error(es.common.error);
    } finally {
      setGenerating(false);
    }
  }, [selectedCaseId, selectedTemplateId, editor, filingTitle]);

  // Save as document
  const handleSave = useCallback(async () => {
    if (!selectedCaseId || !editor || !filingTitle.trim()) return;
    setSaving(true);
    try {
      await filingService.saveFiling({
        caseId: selectedCaseId,
        title: filingTitle.trim(),
        html: editor.getHTML(),
      });
      toast.success(es.filings.savedSuccess);
    } catch {
      toast.error(es.common.error);
    } finally {
      setSaving(false);
    }
  }, [selectedCaseId, editor, filingTitle]);

  // Export to PDF
  const handleExportPdf = useCallback(async () => {
    if (!editor) return;
    setSaving(true);
    try {
      const blob = await filingService.generatePdf(editor.getHTML());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filingTitle.trim() || "escrito"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(es.filings.pdfDownloaded);
    } catch {
      toast.error(es.common.error);
    } finally {
      setSaving(false);
    }
  }, [editor, filingTitle]);

  // Save and export
  const handleSaveAndExport = useCallback(async () => {
    if (!selectedCaseId || !editor || !filingTitle.trim()) return;
    setSaving(true);
    try {
      await filingService.saveFiling({
        caseId: selectedCaseId,
        title: filingTitle.trim(),
        html: editor.getHTML(),
        generatePdf: true,
      });
      // Also download the PDF client-side
      const blob = await filingService.generatePdf(editor.getHTML());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filingTitle.trim()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(es.filings.savedAndExported);
    } catch {
      toast.error(es.common.error);
    } finally {
      setSaving(false);
    }
  }, [selectedCaseId, editor, filingTitle]);

  // Load cases on mount
  useState(() => {
    loadCases();
  });

  const selectedCase = cases.find((c) => c.id === selectedCaseId);
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  // Get unique categories from templates
  const categories = [...new Set(templates.map((t) => t.category))].sort();

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                step >= s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            <span
              className={cn(
                "text-sm",
                step >= s ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {s === 1
                ? es.filings.step1Title
                : s === 2
                  ? es.filings.step2Title
                  : es.filings.step3Title}
            </span>
            {s < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select case */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{es.filings.step1Description}</p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={es.filings.searchCases}
              value={caseSearch}
              onChange={(e) => {
                setCaseSearch(e.target.value);
                loadCases(e.target.value || undefined);
              }}
              className="pl-9"
            />
          </div>

          {loadingCases ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : cases.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{es.filings.noCases}</p>
          ) : (
            <div className="space-y-2">
              {cases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCaseId(c.id)}
                  className={cn(
                    "w-full rounded-lg border p-4 text-left transition-colors",
                    selectedCaseId === c.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="font-medium">{c.caseTitle}</div>
                  {c.caseNumber && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      {es.cases.caseNumber}: {c.caseNumber}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={goToStep2} disabled={!selectedCaseId}>
              {es.common.next}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Select template */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{es.filings.step2Description}</p>

          {/* Selected case badge */}
          {selectedCase && (
            <div className="rounded-md bg-muted px-3 py-2 text-sm">
              <span className="font-medium">{es.cases.title}:</span> {selectedCase.caseTitle}
              {selectedCase.caseNumber && ` (${selectedCase.caseNumber})`}
            </div>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={es.filings.searchTemplates}
                value={templateSearch}
                onChange={(e) => {
                  setTemplateSearch(e.target.value);
                  loadTemplates(e.target.value || undefined, categoryFilter || undefined);
                }}
                className="pl-9"
              />
            </div>
            {categories.length > 1 && (
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  loadTemplates(templateSearch || undefined, e.target.value || undefined);
                }}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">{es.filings.allCategories}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          {loadingTemplates ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{es.filings.noTemplates}</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplateId(t.id)}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-colors",
                    selectedTemplateId === t.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{t.category}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={goToStep1}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              {es.common.back}
            </Button>
            <Button onClick={handleGenerate} disabled={!selectedTemplateId || generating}>
              {generating ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  {es.filings.generating}
                </>
              ) : (
                es.filings.generateButton
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Edit and save */}
      {step === 3 && editor && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{es.filings.step3Description}</p>

          {/* Selected case + template badges */}
          <div className="flex flex-wrap gap-2">
            {selectedCase && (
              <div className="rounded-md bg-muted px-3 py-1 text-sm">
                {selectedCase.caseTitle}
              </div>
            )}
            {selectedTemplate && (
              <div className="rounded-md bg-muted px-3 py-1 text-sm">
                {selectedTemplate.name}
              </div>
            )}
          </div>

          {/* Filing title */}
          <div className="space-y-1.5">
            <Label>{es.filings.titleLabel}</Label>
            <Input
              value={filingTitle}
              onChange={(e) => setFilingTitle(e.target.value)}
              placeholder={es.filings.titlePlaceholder}
            />
          </div>

          {/* TipTap toolbar */}
          <div className="flex flex-wrap gap-1 rounded-t-lg border border-b-0 bg-muted/50 p-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive("bold")}
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive("italic")}
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive("underline")}
            >
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>

            <div className="mx-1 w-px bg-border" />

            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              active={editor.isActive({ textAlign: "left" })}
            >
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              active={editor.isActive({ textAlign: "center" })}
            >
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              active={editor.isActive({ textAlign: "right" })}
            >
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
              active={editor.isActive({ textAlign: "justify" })}
            >
              <AlignJustify className="h-4 w-4" />
            </ToolbarButton>

            <div className="mx-1 w-px bg-border" />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive("bulletList")}
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive("orderedList")}
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>

            <div className="mx-1 w-px bg-border" />

            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              active={false}
            >
              <Undo className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              active={false}
            >
              <Redo className="h-4 w-4" />
            </ToolbarButton>
          </div>

          {/* TipTap editor area */}
          <div className="rounded-b-lg border bg-white dark:bg-background">
            <EditorContent editor={editor} />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setStep(2)} disabled={saving}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              {es.common.back}
            </Button>

            <div className="flex-1" />

            <Button
              variant="outline"
              onClick={handleSave}
              disabled={saving || !filingTitle.trim()}
            >
              {saving ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1 h-4 w-4" />
              )}
              {es.filings.saveAsDocument}
            </Button>

            <Button
              variant="outline"
              onClick={handleExportPdf}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1 h-4 w-4" />
              )}
              {es.filings.exportPdf}
            </Button>

            <Button
              onClick={handleSaveAndExport}
              disabled={saving || !filingTitle.trim()}
            >
              {saving ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="mr-1 h-4 w-4" />
                  <Download className="mr-1 h-4 w-4" />
                </>
              )}
              {es.filings.saveAndExport}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded p-1.5 transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
