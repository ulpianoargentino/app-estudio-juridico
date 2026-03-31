import { useState } from "react";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { PageHeader } from "@/components/ui/page-header";
import { es } from "@/i18n/es";

export function FilingsPage() {
  const [content, setContent] = useState("");

  return (
    <div className="space-y-6">
      <PageHeader
        title={es.filings.editorTitle}
        description={es.filings.editorDescription}
      />
      <RichTextEditor
        content={content}
        onChange={setContent}
        placeholder={es.filings.editorDescription}
      />
    </div>
  );
}
