"use client";

import { useState } from "react";
import { Check, Grid2x2Plus, LayoutTemplate } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  articleTemplates,
  labTemplates,
  projectTemplates,
  type ContentTemplate,
  type TemplateContentType,
} from "@/lib/editor/templates";

const catalogs = {
  project: projectTemplates,
  article: articleTemplates,
  lab: labTemplates,
};

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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setPending(null);
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Content template"
          title="Content template"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Grid2x2Plus className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto p-6">
        {pending ? (
          <>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-warning">
              Replace editor content
            </p>
            <h2 className="mt-2 font-display text-lg font-semibold text-foreground">
              Replace the current editor content with this template?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This will replace the current local document with “{pending.name}
              ”. Autosave will save the replacement as a new editor revision.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="h-10 rounded-md border border-border px-4 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(pending);
                  setPending(null);
                  setOpen(false);
                }}
                className="h-10 rounded-md border border-destructive/40 bg-destructive/10 px-4 text-sm text-destructive"
              >
                Replace content
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Apply a content template
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review the complete structure, then explicitly apply it.
            </p>
            <div className="mt-5 space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-md border border-border bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                        {template.category}
                      </p>
                      <h3 className="mt-1 font-display text-sm font-semibold text-foreground">
                        {template.name}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => select(template)}
                      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-primary/35 px-3 text-xs text-primary hover:bg-primary/10"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Apply
                    </button>
                  </div>
                  {template.sections.length ? (
                    <ol className="mt-3 grid gap-x-5 gap-y-1 border-t border-border pt-3 sm:grid-cols-2">
                      {template.sections.map((section, index) => (
                        <li
                          key={section}
                          className="flex gap-2 text-xs leading-5 text-muted-foreground"
                        >
                          <span className="font-mono text-primary">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span>{section}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                      Empty document
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
