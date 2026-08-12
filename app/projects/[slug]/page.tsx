import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Github, Download, FileText, ExternalLink } from "lucide-react";
import { ContentRenderer } from "@/components/shared/content-renderer";
import { JsonLd } from "@/components/shared/json-ld";
import { RelatedContentLinks } from "@/components/shared/related-content-links";
import { Tag } from "@/components/shared/tag";
import { StatusBadge, DifficultyBadge } from "@/components/shared/status-badges";
import { getAllProjectSlugs, getAllProjects, getProjectBySlug } from "@/lib/content";
import { getAllCertificates } from "@/lib/db/queries/certificates";
import { getFirstContentImage, buildContentMetadata } from "@/lib/metadata";
import { getRelatedContent } from "@/lib/related-content";
import { buildArticleJsonLd } from "@/lib/structured-data";
import { formatDate } from "@/lib/utils";

type ProjectParams = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const slugs = await getAllProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: ProjectParams }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};

  const { frontmatter, content } = project;
  return buildContentMetadata({
    title: frontmatter.title,
    description: frontmatter.summary,
    path: `/projects/${frontmatter.slug}`,
    typeLabel: "Project",
    image: frontmatter.thumbnail ?? getFirstContentImage(content),
    publishedTime: frontmatter.completionDate,
    modifiedTime: frontmatter.lastUpdated,
    tags: [frontmatter.category, ...frontmatter.tags, ...frontmatter.technologies],
  });
}

export default async function ProjectPage({ params }: { params: ProjectParams }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const { frontmatter, content } = project;
  const currentPath = `/projects/${frontmatter.slug}`;
  const [certifications, allProjects, related] = await Promise.all([
    getAllCertificates(),
    getAllProjects(),
    getRelatedContent({
      currentPath,
      tags: frontmatter.tags,
      category: frontmatter.category,
    }),
  ]);
  const cert = certifications.find((certificate) => certificate.id === frontmatter.relatedCertification);
  const idx = allProjects.findIndex((entry) => entry.frontmatter.slug === frontmatter.slug);
  const prev = idx > 0 ? allProjects[idx - 1] : undefined;
  const next = idx >= 0 ? allProjects[idx + 1] : undefined;
  const projectImage = frontmatter.thumbnail ?? getFirstContentImage(content);
  const isWebDevelopment = frontmatter.category.trim().replace(/\s+/g, " ").toLocaleLowerCase() === "web development";
  const projectJsonLd = buildArticleJsonLd({
    type: "TechArticle",
    title: frontmatter.title,
    description: frontmatter.summary,
    path: currentPath,
    image: projectImage,
    publishedTime: frontmatter.completionDate,
    modifiedTime: frontmatter.lastUpdated,
    category: frontmatter.category,
    tags: [...frontmatter.tags, ...frontmatter.technologies],
  });

  return (
    <div>
      <JsonLd data={projectJsonLd} />
      <header className="border-b border-border px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/projects"
            className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-text"
          >
            <ArrowLeft size={12} /> All Projects
          </Link>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="idx">{String(Math.max(0, idx) + 1).padStart(2, "0")}</span>
            <span className="label text-cobalt">{frontmatter.category}</span>
            <StatusBadge status={frontmatter.status} />
          </div>
          <h1 className="font-display text-3xl font-semibold leading-tight text-text sm:text-4xl lg:text-5xl">
            {frontmatter.title}
          </h1>
          <p className="mt-4 text-base text-text-dim sm:text-lg">{frontmatter.summary}</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1fr_260px] lg:px-14">
        <article className="min-w-0 max-w-content">
          <ContentRenderer
            content={content}
            context={{
              model: "Project",
              id: project.recordId,
              slug: frontmatter.slug,
              title: frontmatter.title,
            }}
          />
          <div className="mt-10 border border-border bg-surface-2 p-5">
            <p className="label mb-3">Technologies</p>
            <div className="flex flex-wrap gap-1.5">
              {frontmatter.technologies.map((technology) => (
                <Tag key={technology}>{technology}</Tag>
              ))}
            </div>
          </div>

          <RelatedContentLinks items={related} />

          <div className="mt-10 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
            {prev ? (
              <Link
                href={`/projects/${prev.frontmatter.slug}`}
                className="group flex items-center gap-2 text-sm text-text-dim hover:text-text"
              >
                <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
                <span className="truncate">{prev.frontmatter.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                href={`/projects/${next.frontmatter.slug}`}
                className="group ml-auto flex items-center gap-2 text-right text-sm text-text-dim hover:text-text"
              >
                <span className="truncate">{next.frontmatter.title}</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </article>

        <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <div className="border border-border bg-surface-2 p-5">
            <p className="label mb-3">Metadata</p>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Difficulty</dt>
                <dd><DifficultyBadge difficulty={frontmatter.difficulty} /></dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Est. time</dt>
                <dd className="font-mono text-text-dim">{frontmatter.estimatedTime}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Completed</dt>
                <dd className="font-mono text-text-dim">{formatDate(frontmatter.completionDate)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Updated</dt>
                <dd className="font-mono text-text-dim">{formatDate(frontmatter.lastUpdated)}</dd>
              </div>
            </dl>
          </div>

          {isWebDevelopment && (frontmatter.liveSiteUrl || frontmatter.demoUrl) && (
            <div className="border border-cobalt/40 bg-surface-2 p-5">
              <p className="label mb-3 text-cobalt">Web Project</p>
              <div className="space-y-2">
                {frontmatter.liveSiteUrl && (
                  <a
                    href={frontmatter.liveSiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between border border-cobalt bg-cobalt px-3 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    <span>Open Live Site</span>
                    <ExternalLink size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                )}
                {frontmatter.demoUrl && (
                  <a
                    href={frontmatter.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between border border-border-strong px-3 py-2.5 text-sm font-medium text-text transition-colors hover:border-cobalt hover:text-cobalt"
                  >
                    <span>View Demo</span>
                    <ExternalLink size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="border border-border bg-surface-2 p-5">
            <p className="label mb-3">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {frontmatter.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
            </div>
          </div>

          <div className="border border-border bg-surface-2 p-5">
            <p className="label mb-3">Skills Practiced</p>
            <div className="flex flex-wrap gap-1.5">
              {frontmatter.skills.map((skill) => <Tag key={skill}>{skill}</Tag>)}
            </div>
          </div>

          {(frontmatter.githubUrl || frontmatter.downloads?.length || cert) && (
            <div className="border border-border bg-surface-2 p-5">
              <p className="label mb-3">Resources</p>
              <div className="space-y-2">
                {frontmatter.githubUrl && (
                  <a
                    href={frontmatter.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-text-dim hover:text-text"
                  >
                    <Github size={14} /> GitHub Repository
                  </a>
                )}
                {frontmatter.downloads?.map((download) => (
                  <a
                    key={`${download.label}-${download.href}`}
                    href={download.href}
                    className="flex items-center gap-2 text-sm text-text-dim hover:text-text"
                    download
                  >
                    {download.type === "config" ? <FileText size={14} /> : <Download size={14} />}
                    {download.label}
                  </a>
                ))}
                {cert && (
                  <Link href="/certifications" className="block border-t border-border pt-3 text-sm text-cobalt">
                    {cert.name}
                  </Link>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
