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
    getRelatedContent({ currentPath, tags: frontmatter.tags, category: frontmatter.category }),
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
    <div className="public-project-detail">
      <JsonLd data={projectJsonLd} />

      <header className="public-detail-hero">
        <div className="public-detail-hero-inner">
          <Link href="/projects" className="public-detail-back"><ArrowLeft size={12} /> All work</Link>
          <div className="public-detail-kicker">
            <span>{String(Math.max(0, idx) + 1).padStart(2, "0")} / PROJECT</span>
            <span className="accent">{frontmatter.category}</span>
            <StatusBadge status={frontmatter.status} />
          </div>
          <h1 className="public-detail-title">{frontmatter.title}</h1>
          <p className="public-detail-summary">{frontmatter.summary}</p>
          <div className="public-detail-line" aria-hidden="true"><span /></div>
        </div>
      </header>

      {projectImage ? <div className="public-project-image" style={{ backgroundImage: `url(${projectImage})` }} aria-hidden="true" /> : null}

      <div className="public-detail-layout">
        <article className="public-detail-main">
          <ContentRenderer
            content={content}
            context={{ model: "Project", id: project.recordId, slug: frontmatter.slug, title: frontmatter.title }}
          />

          <div className="public-detail-tech">
            <p>Technologies</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {frontmatter.technologies.map((technology) => <Tag key={technology}>{technology}</Tag>)}
            </div>
          </div>

          <RelatedContentLinks items={related} />

          <div className="public-detail-nav">
            {prev ? (
              <Link href={`/projects/${prev.frontmatter.slug}`}><ArrowLeft size={14} /><span>{prev.frontmatter.title}</span></Link>
            ) : <span />}
            {next ? (
              <Link href={`/projects/${next.frontmatter.slug}`}><span>{next.frontmatter.title}</span><ArrowRight size={14} /></Link>
            ) : null}
          </div>
        </article>

        <aside className="public-detail-aside">
          <section className="public-detail-aside-section">
            <p>Project record</p>
            <dl>
              <div><dt>Difficulty</dt><dd><DifficultyBadge difficulty={frontmatter.difficulty} /></dd></div>
              <div><dt>Est. time</dt><dd className="font-mono">{frontmatter.estimatedTime}</dd></div>
              <div><dt>Completed</dt><dd className="font-mono">{formatDate(frontmatter.completionDate)}</dd></div>
              <div><dt>Updated</dt><dd className="font-mono">{formatDate(frontmatter.lastUpdated)}</dd></div>
            </dl>
          </section>

          {isWebDevelopment && (frontmatter.liveSiteUrl || frontmatter.demoUrl) ? (
            <section className="public-detail-aside-section">
              <p>Experience</p>
              {frontmatter.liveSiteUrl ? <a href={frontmatter.liveSiteUrl} target="_blank" rel="noreferrer" className="public-detail-resource">Open live site <ExternalLink size={13} /></a> : null}
              {frontmatter.demoUrl ? <a href={frontmatter.demoUrl} target="_blank" rel="noreferrer" className="public-detail-resource">View demo <ExternalLink size={13} /></a> : null}
            </section>
          ) : null}

          <section className="public-detail-aside-section">
            <p>Tags</p>
            <div className="flex flex-wrap gap-1.5">{frontmatter.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</div>
          </section>

          <section className="public-detail-aside-section">
            <p>Skills practiced</p>
            <div className="flex flex-wrap gap-1.5">{frontmatter.skills.map((skill) => <Tag key={skill}>{skill}</Tag>)}</div>
          </section>

          {(frontmatter.githubUrl || frontmatter.downloads?.length || cert) ? (
            <section className="public-detail-aside-section">
              <p>Resources</p>
              {frontmatter.githubUrl ? <a href={frontmatter.githubUrl} target="_blank" rel="noreferrer" className="public-detail-resource"><Github size={13} /> GitHub repository</a> : null}
              {frontmatter.downloads?.map((download) => (
                <a key={`${download.label}-${download.href}`} href={download.href} className="public-detail-resource" download>
                  {download.type === "config" ? <FileText size={13} /> : <Download size={13} />}{download.label}
                </a>
              ))}
              {cert ? <Link href="/certifications" className="public-detail-resource">{cert.name}</Link> : null}
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
