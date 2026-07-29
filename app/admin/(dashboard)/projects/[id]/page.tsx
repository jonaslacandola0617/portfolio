import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProjectForm } from "@/components/admin/project-form";
import { getProjectForEdit } from "@/lib/services/project-admin-service";
import { getAllMedia } from "@/lib/services/media-admin-service";

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const [project, media] = await Promise.all([getProjectForEdit(params.id), getAllMedia()]);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-8">
      <Link
        href="/admin/projects"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to projects
      </Link>
      <p className="mb-4 max-w-2xl text-sm leading-6 text-muted-foreground">
        Edit the technical write-up below. Use Project details to manage its
        summary, classification, supporting information, and public visibility.
      </p>
      <ProjectForm
        mode="edit"
        media={media}
        project={{
          id: project.id,
          title: project.title,
          slug: project.slug,
          summary: project.summary,
          category: project.category?.name ?? "",
          difficulty: project.difficulty,
          progressStatus: project.progressStatus,
          publishStatus: project.publishStatus,
          tags: project.tags.map((t) => t.name),
          skills: project.skills.map((s) => s.name),
          technologies: project.technologies,
          estimatedTime: project.estimatedTime ?? "",
          completionDate: project.completionDate.toISOString().slice(0, 10),
          githubUrl: project.githubUrl ?? "",
          scheduledFor: project.scheduledFor ? project.scheduledFor.toISOString().slice(0, 16) : "",
          content: project.content as never,
        }}
      />
    </div>
  );
}
