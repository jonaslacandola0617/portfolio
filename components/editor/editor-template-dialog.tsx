"use client";

import { useState } from "react";
import { Check, LayoutTemplate } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { articleTemplates, labTemplates, projectTemplates, type ContentTemplate, type TemplateContentType } from "@/lib/editor/templates";

const catalogs = { project: projectTemplates, article: articleTemplates, lab: labTemplates };

export function EditorTemplateDialog({
  contentType,
  hasContent,
  onApply,
}: {
  contentType: TemplateContentType;
  hasContent: boolean;
  onApply: (template: ContentTemplate) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<ContentTemplate | null>(null);
  const templates = catalogs[contentType];

  const select = (template: ContentTemplate) => {
    if (hasContent) {
      setPending(template);
      return;
    }
    onApply(template);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setPending(null); }}>
      <DialogTrigger asChild>
        <button type="button" aria-label="Apply content template" title="Apply content template" className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
          <LayoutTemplate className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto p-6">
        {pending ? (
          <>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-warning">Replace editor content</p>
            <h2 className="mt-2 font-display text-lg font-semibold text-foreground">Replace the current editor content with this template?</h2>
            <p className="mt-2 text-sm text-muted-foreground">This will replace the current local document with “{pending.name}”. Autosave will save the replacement as a new editor revision.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setPending(null)} className="h-10 rounded-md border border-border px-4 text-sm">Cancel</button>
              <button type="button" onClick={() => { onApply(pending); setPending(null); setOpen(false); }} className="h-10 rounded-md border border-destructive/40 bg-destructive/10 px-4 text-sm text-destructive">Replace content</button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display text-lg font-semibold text-foreground">Apply a content template</h2>
            <p className="mt-1 text-sm text-muted-foreground">Review the complete structure, then explicitly apply it.</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {templates.map((template) => (
                <div key={template.id} className="rounded-lg border border-border bg-card p-4">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">{template.category}</p>
                  <h3 className="mt-1 text-sm font-semibold text-foreground">{template.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
                  <div className="mt-3 max-h-28 overflow-y-auto rounded border border-border p-2">
                    {template.sections.map((section) => <p key={section} className="py-0.5 text-xs text-muted-foreground">{section}</p>)}
                    {!template.sections.length && <p className="text-xs text-muted-foreground">Empty document</p>}
                  </div>
                  <button type="button" onClick={() => select(template)} className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md border border-primary/35 px-3 text-xs text-primary hover:bg-primary/10"><Check className="h-3.5 w-3.5" />Apply template</button>
                </div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
