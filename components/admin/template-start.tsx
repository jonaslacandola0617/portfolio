"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, FileQuestion, Globe, Code2, Network, ShieldCheck, GitMerge, BookOpen, GraduationCap, RefreshCcw, ClipboardList, Wrench, ScanSearch } from "lucide-react";
import type { ContentTemplate } from "@/lib/editor/templates";
import { cn } from "@/lib/utils";

function TemplateIcon({ template }: { template: ContentTemplate }) {
  const key = `${template.category} ${template.name}`.toLowerCase();
  const Icon = key.includes("blank") ? FileQuestion
    : key.includes("web") ? Globe
    : key.includes("network") ? Network
    : key.includes("cyber") || key.includes("security") ? ShieldCheck
    : key.includes("migration") || key.includes("refactor") ? GitMerge
    : key.includes("tutorial") ? ClipboardList
    : key.includes("packet") || key.includes("concept") ? ScanSearch
    : key.includes("troubleshoot") ? Wrench
    : key.includes("retrospective") ? RefreshCcw
    : key.includes("course") ? GraduationCap
    : key.includes("journal") || key.includes("learning") ? BookOpen
    : Code2;
  return <Icon className="h-4 w-4" />;
}

export function TemplateStart({
  kindLabel,
  templates,
  cancelHref,
}: {
  kindLabel: string;
  templates: ContentTemplate[];
  cancelHref: string;
}) {
  const [selected, setSelected] = useState(templates[1]?.id ?? templates[0]?.id ?? "");
  const selectedTemplate = templates.find((template) => template.id === selected) ?? templates[0];

  return (
    <div className="px-6 py-8 sm:px-10">
      <p className="label mb-2">New {kindLabel}</p>
      <h1 className="mb-8 font-display text-2xl font-semibold text-text">Choose a starting template</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const active = selected === template.id;
          const label = template.name.replace(/^Blank (project|article|lab)$/i, "Blank").replace("Software or Application Development", "Software Development").replace("Networking Project", "Networking").replace("Cybersecurity Project", "Cybersecurity").replace("Migration or Refactoring", "Migration / Refactoring");
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => setSelected(template.id)}
              className={cn(
                "relative flex flex-col items-start gap-3 border p-5 text-left transition-colors",
                active ? "border-cobalt bg-cobalt-dim/40" : "border-border bg-surface-2 hover:border-border-strong",
              )}
              aria-pressed={active}
            >
              {active && (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-cobalt text-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <span className="flex h-10 w-10 items-center justify-center border border-border-strong bg-surface text-cobalt">
                <TemplateIcon template={template} />
              </span>
              <div>
                <h2 className="font-display text-sm font-semibold text-text">{label}</h2>
                <p className="mt-1 text-xs text-text-dim">{template.description}</p>
              </div>
              {template.sections.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {template.sections.map((section) => (
                    <span key={section} className="border border-border px-1.5 py-0.5 text-[10px] text-muted">
                      {section}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
        <Link href={cancelHref} className="text-sm text-text-dim hover:text-text">Cancel</Link>
        {selectedTemplate && (
          <Link
            href={`?template=${encodeURIComponent(selectedTemplate.id)}`}
            className="border border-border-strong bg-text px-5 py-2.5 text-sm font-medium text-surface"
          >
            Continue with "{selectedTemplate.name.replace(/^Blank (project|article|lab)$/i, "Blank")}"
          </Link>
        )}
      </div>
    </div>
  );
}
