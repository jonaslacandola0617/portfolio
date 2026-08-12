import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/admin/project-form";
import { getProjectForEdit } from "@/lib/services/project-admin-service";
import { getAllMedia } from "@/lib/services/media-admin-service";

type ProjectEditParams = Promise<{ id: string }>;

export default async function EditProjectPage({ params }: { params: ProjectEditParams }) {
  const { id } = await params;
  const [project, media] = await Promise.all([getProjectForEdit(id), getAllMedia()]);
  if (!project) notFound();
  return (
    <ProjectForm
      mode="edit"
      media={media}
      project={{
        id: project.id, title: project.title, slug: project.slug, summary: project.summary,
        category: project.category?.name ?? "", difficulty: project.difficulty,
        progressStatus: project.progressStatus, publishStatus: project.publishStatus,
        tags: project.tags.map((t) => t.name), skills: project.skills.map((s) => s.name),
        technologies: project.technologies, estimatedTime: project.estimatedTime ?? "",
        completionDate: project.completionDate.toISOString().slice(0, 10), githubUrl: project.githubUrl ?? "",
        liveSiteUrl: project.liveSiteUrl ?? "", demoUrl: project.demoUrl ?? "",
        scheduledFor: project.scheduledFor ? project.scheduledFor.toISOString().slice(0, 16) : "",
        content: project.content as never,
      }}
    />
  );
}
