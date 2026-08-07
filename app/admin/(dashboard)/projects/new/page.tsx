import { TemplateStart } from "@/components/admin/template-start";
import { projectTemplates } from "@/lib/editor/templates";

export default function NewProjectPage() {
  return (
    <TemplateStart
      kindLabel="project"
      templates={projectTemplates}
      cancelHref="/admin/projects"
    />
  );
}
