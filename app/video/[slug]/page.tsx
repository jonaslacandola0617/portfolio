import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { VideoPlayer } from "@/components/video/video-player";
import { ContentRenderer } from "@/components/shared/content-renderer";
import { JsonLd } from "@/components/shared/json-ld";
import { getAllPublishedVideoSlugs, getPublishedVideoProjects, getVideoProjectBySlug } from "@/lib/db/queries/video";
import { buildContentMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";
import { runtimeToIso8601, videoDisciplineLine, videoYear } from "@/lib/video-format";
import { youtubeEmbedUrl } from "@/lib/youtube";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return (await getAllPublishedVideoSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getVideoProjectBySlug(slug);
  if (!project) return {};
  return buildContentMetadata({
    title: `${project.title} — Video Portfolio`,
    description: project.summary,
    path: `/video/${project.slug}`,
    typeLabel: "Video Portfolio",
    image: project.customPosterUrl,
    publishedTime: project.publishedAt ?? project.completionDate,
    modifiedTime: project.updatedAt,
    tags: [...project.disciplines.map((value) => value === "VIDEO_EDITING" ? "Video Editing" : "Cinematography"), ...project.roles, ...project.tools],
  });
}

export default async function VideoProjectPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [project, allProjects] = await Promise.all([getVideoProjectBySlug(slug), getPublishedVideoProjects()]);
  if (!project) notFound();
  const index = allProjects.findIndex((item) => item.id === project.id);
  const previous = index > 0 ? allProjects[index - 1] : undefined;
  const next = index >= 0 && index < allProjects.length - 1 ? allProjects[index + 1] : undefined;
  const duration = runtimeToIso8601(project.runtime);
  const embedUrl = project.youtubeVideoId ? youtubeEmbedUrl(project.youtubeVideoId) : null;

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: project.title,
    description: project.summary,
    ...(project.customPosterUrl ? { thumbnailUrl: project.customPosterUrl } : {}),
    ...(embedUrl ? { embedUrl } : {}),
    ...(project.youtubeUrl ? { contentUrl: project.youtubeUrl } : {}),
    ...(project.completionDate ? { uploadDate: project.completionDate } : {}),
    ...(duration ? { duration } : {}),
    url: `${siteConfig.siteUrl}/video/${project.slug}`,
  };

  return (
    <article className="mx-auto max-w-[1500px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <JsonLd data={structuredData} />
      <header className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-16">
        <div><p className="idx text-vermilion">01 / {videoDisciplineLine(project.disciplines).toUpperCase()}</p><h1 className="mt-4 max-w-5xl font-display text-5xl leading-[0.95] tracking-[-0.03em] text-text sm:text-7xl lg:text-8xl">{project.title}</h1><p className="mt-6 max-w-3xl text-base leading-7 text-text-dim sm:text-lg">{project.summary}</p></div>
        <dl className="divide-y divide-border border-y border-border text-sm">
          {project.roles.length ? <div className="grid grid-cols-[110px_1fr] gap-3 py-3"><dt className="idx">My Role</dt><dd className="text-text">{project.roles.join(", ")}</dd></div> : null}
          <div className="grid grid-cols-[110px_1fr] gap-3 py-3"><dt className="idx">Discipline</dt><dd className="text-text">{videoDisciplineLine(project.disciplines)}</dd></div>
          {project.completionDate ? <div className="grid grid-cols-[110px_1fr] gap-3 py-3"><dt className="idx">Completed</dt><dd className="text-text">{videoYear(project.completionDate)}</dd></div> : null}
          {project.runtime ? <div className="grid grid-cols-[110px_1fr] gap-3 py-3"><dt className="idx">Runtime</dt><dd className="font-mono text-text">{project.runtime}</dd></div> : null}
          {project.client ? <div className="grid grid-cols-[110px_1fr] gap-3 py-3"><dt className="idx">Client</dt><dd className="text-text">{project.client}</dd></div> : null}
          {project.tools.length ? <div className="grid grid-cols-[110px_1fr] gap-3 py-3"><dt className="idx">Tools</dt><dd className="text-text">{project.tools.join(", ")}</dd></div> : null}
        </dl>
      </header>

      <div className="py-10 sm:py-14"><VideoPlayer videoId={project.youtubeVideoId} posterUrl={project.customPosterUrl} title={project.title} priority /></div>

      <section className="grid gap-8 border-t border-border pt-10 lg:grid-cols-[220px_minmax(0,760px)] lg:justify-between"><p className="idx">02 / CASE STUDY</p><ContentRenderer content={project.content} context={{ model: "Project", id: project.id, slug: project.slug, title: project.title }} /></section>

      <nav aria-label="Video project navigation" className="mt-16 grid gap-px border-y border-border bg-border sm:grid-cols-2">
        <div className="bg-surface p-5 sm:p-6">{previous ? <Link href={`/video/${previous.slug}`} className="group block"><span className="label flex items-center gap-2 text-[10px] text-muted"><ArrowLeft className="h-3 w-3" /> Previous</span><span className="mt-2 block font-display text-2xl text-text group-hover:text-vermilion">{previous.title}</span></Link> : <Link href="/video/work" className="label text-[10px] text-text-dim">← Back to work</Link>}</div>
        <div className="bg-surface p-5 text-right sm:p-6">{next ? <Link href={`/video/${next.slug}`} className="group block"><span className="label flex items-center justify-end gap-2 text-[10px] text-muted">Next <ArrowRight className="h-3 w-3" /></span><span className="mt-2 block font-display text-2xl text-text group-hover:text-vermilion">{next.title}</span></Link> : <Link href="/video/work" className="label text-[10px] text-text-dim">Back to work →</Link>}</div>
      </nav>
    </article>
  );
}
