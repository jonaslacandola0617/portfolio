import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProjectForm } from "@/components/admin/project-form";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-10">
      <Link
        href="/admin/projects"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to projects
      </Link>
      <h1 className="font-display text-2xl font-semibold text-foreground">New project</h1>
      <p className="mb-6 mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
        Create the public-facing project details first. The technical write-up
        editor opens after the project has an id.
      </p>
      <ProjectForm mode="create" />
    </div>
  );
}
