import { PageHeader, PageShell } from "@/components/shared/page-header";
import { VideoProjectForm } from "@/components/admin/video-project-form";
import { getAllMedia } from "@/lib/services/media-admin-service";
import { emptyTemplate } from "@/lib/editor/templates";

export default async function NewVideoProjectPage() {
  const media = await getAllMedia();
  return (
    <div>
      <PageHeader index="Video & design" eyebrow="Add a video. It appears on /video once published." title="New video" />
      <PageShell>
        <VideoProjectForm
          media={media}
          project={{
            title: "",
            slug: "",
            summary: "",
            content: emptyTemplate,
            youtubeUrl: "",
            disciplines: [],
            roles: [],
            tools: [],
            client: "",
            runtime: "",
            customPosterId: "",
            completionDate: "",
            publishStatus: "DRAFT",
            scheduledFor: "",
          }}
        />
      </PageShell>
    </div>
  );
}
