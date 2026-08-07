import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProjectForm } from "@/components/admin/project-form";
import { TemplateStart } from "@/components/admin/template-start";
import { projectTemplates } from "@/lib/editor/templates";

export default function NewProjectPage({ searchParams }: { searchParams: { template?: string } }) {
  const selected = projectTemplates.find((template) => template.id === searchParams.template);
  if (!selected) return <TemplateStart kindLabel="project" templates={projectTemplates} cancelHref="/admin/projects" />;
  return (
    <div className="px-6 py-8 sm:px-10">
      <Link href="/admin/projects/new" className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text">
        <ArrowLeft className="h-3.5 w-3.5" /> Change template
      </Link>
      <p className="label mb-2">New project · {selected.name}</p>
      <h1 className="font-display text-2xl font-semibold text-text">Project details</h1>
      <p className="mb-8 mt-1 max-w-2xl text-sm text-text-dim">Set the public metadata. The selected template will be inserted into the editor when the project is created.</p>
      <div className="max-w-3xl"><ProjectForm mode="create" templateId={selected.id} /></div>
    </div>
  );
}
