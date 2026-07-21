import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Github, RefreshCw } from "lucide-react";
import { ContentRenderer } from "@/components/shared/content-renderer";
import { TableOfContents } from "@/components/shared/table-of-contents";
import { ReadingProgress } from "@/components/shared/reading-progress";
import { DownloadCard } from "@/components/shared/download-card";
import { RelatedContent } from "@/components/shared/related-content";
import { Tag } from "@/components/shared/tag";
import { StatusBadge, DifficultyBadge } from "@/components/shared/status-badges";
import { Badge } from "@/components/ui/badge";
import { getAllProjectSlugs, getAllProjects, getProjectBySlug } from "@/lib/content";
import { getAllCertificates } from "@/lib/db/queries/certificates";
import { formatDate } from "@/lib/utils";

export async function generateStaticParams() {
  const slugs = await getAllProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const project = await getProjectBySlug(params.slug);
  if (!project) return {};
  return {
    title: project.frontmatter.title,
    description: project.frontmatter.summary,
  };
}

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const project = await getProjectBySlug(params.slug);
  if (!project) notFound();

  const { frontmatter, content } = project;
  const certifications = await getAllCertificates();
  const cert = certifications.find((c) => c.id === frontmatter.relatedCertification);
  const allProjects = await getAllProjects();
  const related = allProjects
    .filter((p) => p.frontmatter.slug !== frontmatter.slug)
    .filter((p) => p.frontmatter.tags.some((t) => frontmatter.tags.includes(t)))
    .slice(0, 4);

  return (
    <div>
      <ReadingProgress />
      <div className="mx-auto max-w-6xl px-6 py-14 md:px-10">
        <Link
          href="/projects"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to projects
        </Link>

        <div className="grid gap-10 lg:grid-cols-[1fr_260px]">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={frontmatter.status} />
              <DifficultyBadge difficulty={frontmatter.difficulty} />
              <Badge variant="outline">{frontmatter.category}</Badge>
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl text-balance">
              {frontmatter.title}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">{frontmatter.summary}</p>

            <div className="mt-5 flex flex-wrap items-center gap-4 font-mono text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {frontmatter.estimatedTime}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Completed {formatDate(frontmatter.completionDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Updated {formatDate(frontmatter.lastUpdated)}
              </span>
              {frontmatter.githubUrl && (
                <a
                  href={frontmatter.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Github className="h-3.5 w-3.5" /> Repository
                </a>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {frontmatter.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>

            <div id="article-content" className="mt-10">
              <ContentRenderer content={content} />
            </div>

            {frontmatter.downloads && frontmatter.downloads.length > 0 && (
              <div className="mt-10 border-t border-border pt-8">
                <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Downloads
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {frontmatter.downloads.map((d) => (
                    <DownloadCard key={d.label} item={d} />
                  ))}
                </div>
              </div>
            )}

            <RelatedContent
              title="Related Projects"
              items={related.map((p) => ({
                title: p.frontmatter.title,
                href: `/projects/${p.frontmatter.slug}`,
                meta: p.frontmatter.category,
              }))}
            />
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block space-y-8">
            <TableOfContents />

            <div>
              <h3 className="mb-3 font-mono text-[0.68rem] uppercase tracking-widest text-muted-foreground/70">
                Technologies
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {frontmatter.technologies.map((t) => (
                  <Badge key={t} variant="default">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-mono text-[0.68rem] uppercase tracking-widest text-muted-foreground/70">
                Skills Practiced
              </h3>
              <ul className="space-y-1.5">
                {frontmatter.skills.map((s) => (
                  <li key={s} className="text-sm text-foreground/85">
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {cert && (
              <div>
                <h3 className="mb-3 font-mono text-[0.68rem] uppercase tracking-widest text-muted-foreground/70">
                  Related Certification
                </h3>
                <Link
                  href="/certifications"
                  className="block rounded-md border border-border bg-card p-3 text-sm text-foreground hover:border-primary/40"
                >
                  {cert.name}
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
