import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ArticleForm } from "@/components/admin/article-form";
import { TemplateStart } from "@/components/admin/template-start";
import { articleTemplates } from "@/lib/editor/templates";

export default function NewArticlePage({ searchParams }: { searchParams: { template?: string } }) {
  const selected = articleTemplates.find((template) => template.id === searchParams.template);
  if (!selected) return <TemplateStart kindLabel="journal entry" templates={articleTemplates} cancelHref="/admin/journal" />;
  return (
    <div className="px-6 py-8 sm:px-10">
      <Link href="/admin/journal/new" className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text"><ArrowLeft className="h-3.5 w-3.5" /> Change template</Link>
      <p className="label mb-2">New journal entry · {selected.name}</p>
      <h1 className="font-display text-2xl font-semibold text-text">Journal details</h1>
      <p className="mb-8 mt-1 max-w-2xl text-sm text-text-dim">Set the publishing metadata. The selected structure will open in the editor after creation.</p>
      <div className="max-w-3xl"><ArticleForm mode="create" templateId={selected.id} /></div>
    </div>
  );
}
