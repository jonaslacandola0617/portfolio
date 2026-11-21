import { PageHeader, PageShell } from "@/components/shared/page-header";
import { VideoWorkBrowser } from "@/components/video/video-work-browser";
import { getPublishedVideoProjects } from "@/lib/db/queries/video";
import { buildStaticPageMetadata } from "@/lib/metadata";
import { hasMeaningfulTipTapContent } from "@/lib/editor/content-presence";
import { videoDisciplineLine, videoYear } from "@/lib/video-format";

export const metadata = buildStaticPageMetadata({
  title: "Video Work — Editing & Cinematography",
  description: "Browse published video editing and cinematography projects by Jonas Lacandola, with large-format posters, project details, and optional case studies.",
  path: "/video/work",
  keywords: ["video editing work", "cinematography projects", "video portfolio"],
});

export default async function VideoWorkPage() {
  const projects = await getPublishedVideoProjects();
  const workItems = projects.map((project) => {
    const hasCaseStudy = hasMeaningfulTipTapContent(project.content);
    return {
      id: project.id,
      title: project.title,
      slug: project.slug,
      summary: project.summary,
      youtubeVideoId: project.youtubeVideoId ?? undefined,
      customPosterUrl: project.customPosterUrl ?? undefined,
      discipline: videoDisciplineLine(project.disciplines),
      meta:
        [videoYear(project.completionDate), project.runtime].filter(Boolean).join(" · ") ||
        "",
      linkLabel: hasCaseStudy ? "Watch & read case study" : "Watch & details",
    };
  });

  return (
    <div>
      <PageHeader
        index="Video"
        eyebrow="All videos"
        title="Editing & cinematography."
        description="Short films, event edits and experiments. Press play on any poster to watch it here."
      />
      <PageShell>
        {projects.length ? (
          <VideoWorkBrowser projects={workItems} />
        ) : (
          <p className="muted">No videos are published yet. New work appears here after it&apos;s published in the admin.</p>
        )}
      </PageShell>
    </div>
  );
}
