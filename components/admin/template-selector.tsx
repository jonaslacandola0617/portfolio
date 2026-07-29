"use client";

import { useState } from "react";
import { Check, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { ContentTemplate } from "@/lib/editor/templates";
import { cn } from "@/lib/utils";

export function TemplateSelector({
  templates,
  name = "templateId",
}: {
  templates: ContentTemplate[];
  name?: string;
}) {
  const [selected, setSelected] = useState(templates[0]?.id ?? "");

  return (
    <fieldset className="space-y-3">
      <input type="hidden" name={name} value={selected} />
      <div>
        <legend className="font-display text-sm font-semibold text-foreground">Starting template</legend>
        <p className="mt-1 text-xs text-muted-foreground">Choose Blank or one structure. Nothing is inserted until the record is created.</p>
      </div>
      <div className="space-y-2">
        {templates.map((template) => {
          const active = selected === template.id;
          return (
            <div
              key={template.id}
              role="radio"
              aria-checked={active}
              tabIndex={0}
              onClick={() => setSelected(template.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelected(template.id);
                }
              }}
              className={cn(
                "relative cursor-pointer rounded-md border bg-background p-4 transition-colors",
                active
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-muted/30"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">{template.category}</p>
                  <h3 className="mt-1 font-display text-sm font-semibold text-foreground">{template.name}</h3>
                </div>
                {active && <span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><Check className="h-3.5 w-3.5" />Selected</span>}
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{template.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {template.sections.length
                    ? `${template.sections.length} structured sections`
                    : "Empty document"}
                </span>
                <Dialog>
                  <DialogTrigger asChild>
                    <button type="button" onClick={(event) => event.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Eye className="h-3.5 w-3.5" />Preview</button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[75vh] overflow-y-auto p-6" onClick={(event) => event.stopPropagation()}>
                    <h2 className="font-display text-lg font-semibold text-foreground">{template.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                    <ol className="mt-5 space-y-2">
                      {template.sections.map((section, index) => <li key={section} className="flex gap-3 rounded border border-border px-3 py-2 text-sm"><span className="font-mono text-xs text-primary">{String(index + 1).padStart(2, "0")}</span>{section}</li>)}
                      {!template.sections.length && <li className="text-sm text-muted-foreground">The editor starts empty.</li>}
                    </ol>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
