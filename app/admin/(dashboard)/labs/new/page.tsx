import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LabForm } from "@/components/admin/lab-form";
import { TemplateStart } from "@/components/admin/template-start";
import { labTemplates } from "@/lib/editor/templates";

export default function NewLabPage({ searchParams }: { searchParams: { template?: string } }) {
  const selected = labTemplates.find((template) => template.id === searchParams.template);
  if (!selected) return <TemplateStart kindLabel="lab" templates={labTemplates} cancelHref="/admin/labs" />;
  return (
    <div className="px-6 py-8 sm:px-10">
      <Link href="/admin/labs/new" className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text"><ArrowLeft className="h-3.5 w-3.5" /> Change template</Link>
      <p className="label mb-2">New lab · {selected.name}</p>
      <h1 className="font-display text-2xl font-semibold text-text">Lab details</h1>
      <p className="mb-8 mt-1 max-w-2xl text-sm text-text-dim">Set the lab metadata. The selected structure will open in the editor after creation.</p>
      <div className="max-w-3xl"><LabForm mode="create" templateId={selected.id} /></div>
    </div>
  );
}
