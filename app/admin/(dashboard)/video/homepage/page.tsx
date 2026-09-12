import { PageHeader, PageShell } from "@/components/shared/page-header";
import { VideoHomepageForm } from "@/components/admin/video-homepage-form";
import { getVideoHomepageSettingsForAdmin } from "@/lib/services/video-admin-service";

export default async function AdminVideoHomepagePage() {
  const { settings, publishedVideos } = await getVideoHomepageSettingsForAdmin();
  return (
    <div>
      <PageHeader index="05.01" eyebrow="Curate the Video landing page." title="Video Homepage" />
      <PageShell>
        <VideoHomepageForm
          settings={{
            eyebrow: settings.eyebrow,
            headline: settings.headline,
            intro: settings.intro,
            aboutHeading: settings.aboutHeading,
            aboutBody: settings.aboutBody,
            videoEditingDescription: settings.videoEditingDescription,
            cinematographyDescription: settings.cinematographyDescription,
            heroVideoId: settings.heroVideoId,
            featuredVideoIds: settings.featuredVideoIds,
          }}
          videos={publishedVideos.map((video) => ({ id: video.id, title: video.title, disciplines: video.disciplines }))}
        />
      </PageShell>
    </div>
  );
}
