"use client";

import { useMemo, useState } from "react";
import { Check, Grid2x2Plus, LayoutTemplate } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  const [selectedId, setSelectedId] = useState(templates[0]?.id ?? "");
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? null,
    [selectedId, templates],
  );

  const apply = (template: ContentTemplate) => {
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
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Grid2x2Plus className="h-4 w-4" />
        </button>
      </DialogTrigger>

      <DialogContent className="top-6 grid max-h-[calc(100dvh-3rem)] max-w-4xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-card p-0 sm:top-10 sm:max-h-[calc(100dvh-5rem)]">
        {pending ? (
          <>
            <div className="px-6 pb-4 pt-6 pr-12">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-warning">
                Replace editor content
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold text-foreground">
                Replace the current content?
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Applying “{pending.name}” replaces the current local document.
                Autosave records the replacement as the newest editor revision.
              </p>
            </div>

            <div className="min-h-0 overflow-y-auto px-6 pb-6">
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                <p className="font-mono text-[0.65rem] uppercase tracking-widest text-warning">
                  Selected template
                </p>
                <h3 className="mt-1 font-display text-base font-semibold text-foreground">
                  {pending.name}
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {pending.description}
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 bg-card px-6 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPending(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  onApply(pending);
                  setPending(null);
                  setOpen(false);
                }}
              >
                Replace content
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="px-6 pb-4 pt-6 pr-12">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
                <LayoutTemplate className="h-4 w-4" aria-hidden="true" />
                Content templates
              </div>
              <h2 className="mt-2 font-display text-xl font-semibold text-foreground">
                Choose a starting structure
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Select a structure for this write-up, review its scope, then
                apply it explicitly to the editor.
              </p>
            </div>

            <div className="min-h-0 overflow-y-auto px-6 pb-6 scrollbar-thin">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => {
                  const selected = selectedId === template.id;
                  return (
                    <article
                      key={template.id}
                      className={`group overflow-hidden rounded-lg border bg-background transition-all duration-200 ${
                        selected
                          ? "border-primary/50"
                          : "border-border hover:-translate-y-0.5 hover:border-primary/40"
                      }`}
                    >
                      <div className="relative flex h-24 items-center justify-center bg-grid bg-muted/30 px-4">
                        <span className="rounded-md border border-border bg-background px-2.5 py-1 text-center font-mono text-[0.68rem] text-muted-foreground">
                          {template.category}
                        </span>
                        {selected && (
                          <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            <span className="sr-only">Selected</span>
                          </span>
                        )}
                      </div>

                      <div className="flex min-h-48 flex-col p-4">
                        <h3 className="font-display text-base font-semibold text-foreground">
                          {template.name}
                        </h3>
                        <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-muted-foreground">
                          {template.description}
                        </p>
                        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                          <span className="font-mono text-[0.66rem] text-muted-foreground">
                            {template.sections.length
                              ? `${template.sections.length} sections`
                              : "Blank document"}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant={selected ? "default" : "outline"}
                            onClick={() => setSelectedId(template.id)}
                            aria-pressed={selected}
                          >
                            {selected ? "Selected" : "Select"}
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 bg-card px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-muted-foreground">
                {selectedTemplate
                  ? `${selectedTemplate.name} is selected.`
                  : "Select a template to continue."}
              </p>
              <Button
                type="button"
                disabled={!selectedTemplate}
                onClick={() => selectedTemplate && apply(selectedTemplate)}
              >
                Apply selected template
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
