"use client";

import { useMemo, useState } from "react";
import { Check, Grid2x2Check, Grid2x2Plus } from "lucide-react";
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
          className="flex h-7 w-7 shrink-0 items-center justify-center text-text-dim transition-colors hover:bg-surface-3 hover:text-text focus-visible:outline-none focus-visible:border-cobalt"
        >
          <Grid2x2Plus className="h-[13px] w-[13px]" />
        </button>
      </DialogTrigger>

      <DialogContent className="top-6 grid max-h-[calc(100dvh-3rem)] max-w-4xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-surface-2 p-0 sm:top-10 sm:max-h-[calc(100dvh-5rem)]">
        {pending ? (
          <>
            <div className="px-6 pb-4 pt-6 pr-12">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-signal">
                Replace editor content
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold text-text">
                Replace the current content?
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-dim">
                Applying “{pending.name}” replaces the current local document.
                Autosave records the replacement as the newest editor revision.
              </p>
            </div>

            <div className="min-h-0 overflow-y-auto px-6 pb-6">
              <div className="border border-signal/30 bg-signal/5 p-4">
                <p className="font-mono text-[0.65rem] uppercase tracking-widest text-signal">
                  Selected template
                </p>
                <h3 className="mt-1 font-display text-base font-semibold text-text">
                  {pending.name}
                </h3>
                <p className="mt-1 text-sm leading-6 text-text-dim">
                  {pending.description}
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 bg-surface-2 px-6 py-4 sm:flex-row sm:justify-end">
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
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-cobalt">
                <Grid2x2Check className="h-4 w-4" aria-hidden="true" />
                Content templates
              </div>
              <h2 className="mt-2 font-display text-xl font-semibold text-text">
                Choose a starting structure
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-dim">
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
                      className={`group overflow-hidden border bg-surface transition-all duration-200 ${
                        selected
                          ? "border-cobalt"
                          : "border-border hover:border-cobalt/40"
                      }`}
                    >
                      <div className="relative flex h-24 items-center justify-center bg-surface bg-surface-3 px-4">
                        <span className="border border-border bg-surface px-2.5 py-1 text-center font-mono text-[0.68rem] text-text-dim">
                          {template.category}
                        </span>
                        {selected && (
                          <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center-full bg-text text-surface">
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="sr-only">Selected</span>
                          </span>
                        )}
                      </div>

                      <div className="flex min-h-48 flex-col p-4">
                        <h3 className="font-display text-base font-semibold text-text">
                          {template.name}
                        </h3>
                        <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-text-dim">
                          {template.description}
                        </p>
                        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                          <span className="font-mono text-[0.66rem] text-text-dim">
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

            <div className="flex flex-col gap-3 bg-surface-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-text-dim">
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
