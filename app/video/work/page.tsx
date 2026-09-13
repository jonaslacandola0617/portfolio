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
      discipline: videoDisciplineLine(project.disciplines).toUpperCase(),
      meta:
        [videoYear(project.completionDate), project.runtime].filter(Boolean).join(" · ") ||
        (hasCaseStudy ? "CASE STUDY" : "VIDEO PROJECT"),
      linkLabel: hasCaseStudy ? "Case study" : "Project",
    };
  });

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
      <header className="mb-8 border-b border-border pb-8 sm:mb-10"><p className="idx text-vermilion">02 / ARCHIVE</p><h1 className="mt-4 font-display text-5xl leading-none text-text sm:text-7xl lg:text-8xl">VIDEO WORK</h1><p className="mt-5 max-w-2xl text-base leading-7 text-text-dim">Published editing and cinematography pieces, ordered as a visual archive rather than a filtered catalogue.</p></header>
      {projects.length ? (
        <VideoWorkBrowser projects={workItems} />
      ) : (
        <div className="border border-dashed border-border px-6 py-16 text-center"><p className="font-display text-3xl text-text">The archive is ready.</p><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-text-dim">No Video projects are published yet. New work will appear here automatically after it is published through the admin.</p></div>
      )}
    </div>
  );
}
