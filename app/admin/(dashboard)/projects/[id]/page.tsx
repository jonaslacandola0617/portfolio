import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/admin/project-form";
import { getProjectForEdit } from "@/lib/services/project-admin-service";
import { getAllMedia } from "@/lib/services/media-admin-service";

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const [project, media] = await Promise.all([getProjectForEdit(params.id), getAllMedia()]);
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
        scheduledFor: project.scheduledFor ? project.scheduledFor.toISOString().slice(0, 16) : "",
        content: project.content as never,
      }}
    />
  );
}
