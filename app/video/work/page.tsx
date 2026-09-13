import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VideoPlayer } from "@/components/video/video-player";
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
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
      <header className="mb-12 border-b border-border pb-8 sm:mb-16"><p className="idx text-vermilion">02 / ARCHIVE</p><h1 className="mt-4 font-display text-5xl leading-none text-text sm:text-7xl lg:text-8xl">VIDEO WORK</h1><p className="mt-5 max-w-2xl text-base leading-7 text-text-dim">Published editing and cinematography pieces, ordered as a visual archive rather than a filtered catalogue.</p></header>
      {projects.length ? (
        <div className="grid gap-x-8 gap-y-14 lg:grid-cols-2 lg:gap-y-20">
          {projects.map((project, index) => {
            const hasCaseStudy = hasMeaningfulTipTapContent(project.content);
            return <article key={project.id}>
              <VideoPlayer videoId={project.youtubeVideoId} posterUrl={project.customPosterUrl} title={project.title} />
              <div className="mt-4 border-t border-border pt-4">
                <p className="idx text-vermilion">{String(index + 1).padStart(2, "0")} / {videoDisciplineLine(project.disciplines).toUpperCase()}</p>
                <h2 className="mt-2 font-display text-3xl leading-tight text-text sm:text-4xl">{project.title}</h2>
                <div className="mt-3 flex items-center justify-between gap-4"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{[videoYear(project.completionDate), project.runtime].filter(Boolean).join(" · ") || (hasCaseStudy ? "CASE STUDY" : "VIDEO PROJECT")}</p><Link href={`/video/${project.slug}`} className="label flex items-center gap-2 text-[10px] text-text-dim hover:text-text">{hasCaseStudy ? "Case study" : "Project"} <ArrowRight className="h-3 w-3" /></Link></div>
              </div>
            </article>;
          })}
        </div>
      ) : (
        <div className="border border-dashed border-border px-6 py-16 text-center"><p className="font-display text-3xl text-text">The archive is ready.</p><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-text-dim">No Video projects are published yet. New work will appear here automatically after it is published through the admin.</p></div>
      )}
    </div>
  );
}
