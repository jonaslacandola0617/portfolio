import { TemplateStart } from "@/components/admin/template-start";
import { labTemplates } from "@/lib/editor/templates";

export default function NewLabPage() {
  return (
    <TemplateStart
      kindLabel="lab"
      templates={labTemplates}
      cancelHref="/admin/labs"
    />
  );
}
