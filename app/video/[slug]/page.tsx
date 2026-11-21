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
import { hasMeaningfulTipTapContent } from "@/lib/editor/content-presence";

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
    tags: [...project.disciplines.map((value) => (value === "VIDEO_EDITING" ? "Video Editing" : "Cinematography")), ...project.roles, ...project.tools],
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
  const hasCaseStudy = hasMeaningfulTipTapContent(project.content);

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

  const facts = [
    project.roles.length ? { label: "My role", value: project.roles.join(", ") } : null,
    { label: "Discipline", value: videoDisciplineLine(project.disciplines) },
    project.completionDate ? { label: "Completed", value: String(videoYear(project.completionDate)) } : null,
    project.runtime ? { label: "Runtime", value: project.runtime } : null,
    project.client ? { label: "Client", value: project.client } : null,
    project.tools.length ? { label: "Tools", value: project.tools.join(", ") } : null,
  ].filter((fact): fact is { label: string; value: string } => fact !== null);

  return (
    <article className="case-study">
      <JsonLd data={structuredData} />
      <header className="case-hero">
        <Link href="/video/work" className="case-back"><ArrowLeft size={15} /> All videos</Link>
        <p className="work-meta">
          <span className="work-index">Video</span>
          <span>{videoDisciplineLine(project.disciplines)}</span>
        </p>
        <h1>{project.title}</h1>
        <p className="case-summary">{project.summary}</p>
        <dl className="case-facts">
          {facts.slice(0, 4).map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
        </dl>
      </header>

      <div className="case-media">
        <VideoPlayer videoId={project.youtubeVideoId} posterUrl={project.customPosterUrl} title={project.title} priority />
      </div>

      <div className="case-layout">
        <div className="case-main">
          {hasCaseStudy ? (
            <ContentRenderer content={project.content} context={{ model: "Project", id: project.id, slug: project.slug, title: project.title }} />
          ) : (
            <p className="muted">No written case study for this one. The video speaks for itself.</p>
          )}

          <nav className="case-pager" aria-label="More videos">
            {previous ? (
              <Link href={`/video/${previous.slug}`}><small><ArrowLeft size={13} /> Previous</small><strong>{previous.title}</strong></Link>
            ) : <Link href="/video/work"><small><ArrowLeft size={13} /> Back</small><strong>All videos</strong></Link>}
            {next ? (
              <Link href={`/video/${next.slug}`}><small>Next <ArrowRight size={13} /></small><strong>{next.title}</strong></Link>
            ) : <Link href="/video/work"><small>Back <ArrowRight size={13} /></small><strong>All videos</strong></Link>}
          </nav>
        </div>
        {facts.length > 4 ? (
          <aside className="case-aside">
            {facts.slice(4).map((fact) => (
              <section key={fact.label}><p className="footer-label">{fact.label}</p><p className="case-aside-note">{fact.value}</p></section>
            ))}
          </aside>
        ) : <aside className="case-aside" />}
      </div>
    </article>
  );
}
