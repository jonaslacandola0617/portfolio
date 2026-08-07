import { TemplateStart } from "@/components/admin/template-start";
import { articleTemplates } from "@/lib/editor/templates";

export default function NewArticlePage() {
  return (
    <TemplateStart
      kindLabel="journal entry"
      templates={articleTemplates}
      cancelHref="/admin/journal"
    />
  );
}
