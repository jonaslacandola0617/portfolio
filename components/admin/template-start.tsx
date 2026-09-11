"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Check, FileQuestion, Globe, Code2, Network, ShieldCheck, GitMerge, BookOpen, GraduationCap, RefreshCcw, ClipboardList, Wrench, ScanSearch } from "lucide-react";
import { createDraftFromTemplateAction, type CreateDraftState } from "@/app/admin/(dashboard)/draft-actions";
import type { ContentTemplate } from "@/lib/editor/templates";
import { PageHeader, PageShell } from "@/components/shared/page-header";
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

function StartWritingButton({ template }: { template: ContentTemplate }) {
  const { pending } = useFormStatus();
  const label = template.name.replace(/^Blank (project|article|lab)$/i, "Blank");
  return (
    <button
      type="submit"
      disabled={pending}
      className="admin-template-start-button"
    >
      {pending ? "Creating draft…" : `Start with ${label}`}
    </button>
  );
}

const initialState: CreateDraftState = { success: false };

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
  const [state, action] = useFormState(createDraftFromTemplateAction, initialState);
  const selectedTemplate = templates.find((template) => template.id === selected) ?? templates[0];

  return (
    <div>
      <PageHeader
        index="NEW"
        eyebrow={`Create ${kindLabel}.`}
        title="Start from structure"
        description="Choose the closest starting point. Templates only shape the initial document; everything remains editable once the draft opens."
      />
      <PageShell>
        <div className="admin-template-list">
          {templates.map((template, index) => {
            const active = selected === template.id;
            const label = template.name.replace(/^Blank (project|article|lab)$/i, "Blank").replace("Software or Application Development", "Software Development").replace("Networking Project", "Networking").replace("Cybersecurity Project", "Cybersecurity").replace("Migration or Refactoring", "Migration / Refactoring");
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelected(template.id)}
                className={cn("admin-template-row", active && "is-active")}
                aria-pressed={active}
              >
                <span className="admin-template-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="admin-template-icon"><TemplateIcon template={template} /></span>
                <span className="admin-template-copy">
                  <strong>{label}</strong>
                  <small>{template.description}</small>
                </span>
                <span className="admin-template-sections">
                  {template.sections.slice(0, 3).map((section) => <i key={section}>{section}</i>)}
                </span>
                <span className="admin-template-choice">{active ? <Check className="h-3.5 w-3.5" /> : null}</span>
              </button>
            );
          })}
        </div>

        {state.message && <p role="alert" className="mt-4 text-sm text-vermilion">{state.message}</p>}

        <div className="admin-template-foot">
          <Link href={cancelHref}>Cancel</Link>
          {selectedTemplate && (
            <form action={action}>
              <input type="hidden" name="contentType" value={selectedTemplate.contentType} />
              <input type="hidden" name="templateId" value={selectedTemplate.id} />
              <StartWritingButton template={selectedTemplate} />
            </form>
          )}
        </div>
      </PageShell>
    </div>
  );
}
