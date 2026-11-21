import { notFound } from "next/navigation";
import { VideoProjectForm } from "@/components/admin/video-project-form";
import { getVideoProjectForEdit } from "@/lib/services/video-admin-service";
import { getAllMedia } from "@/lib/services/media-admin-service";
import { PageHeader, PageShell } from "@/components/shared/page-header";

type Params = Promise<{ id: string }>;

export default async function EditVideoProjectPage({ params }: { params: Params }) {
  const { id } = await params;
  const [project, media] = await Promise.all([getVideoProjectForEdit(id), getAllMedia()]);
  if (!project) notFound();

  const editorProject = {
    id: project.id,
    title: project.title,
    slug: project.slug,
    summary: project.summary,
    content: project.content as never,
    youtubeUrl: project.youtubeUrl ?? "",
    disciplines: project.disciplines,
    roles: project.roles,
    tools: project.tools,
    client: project.client ?? "",
    runtime: project.runtime ?? "",
    customPosterId: project.customPosterId ?? "",
    completionDate: project.completionDate?.toISOString().slice(0, 10) ?? "",
    publishStatus: project.publishStatus,
    scheduledFor: project.scheduledFor?.toISOString().slice(0, 16) ?? "",
  };

  return (
    <div>
      <PageHeader index="Video & design" eyebrow="Edit this video and its case study." title={project.title} />
      <PageShell>
        <VideoProjectForm media={media} project={editorProject} />
      </PageShell>
    </div>
  );
}
