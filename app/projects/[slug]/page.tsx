import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Github, Download, FileText, ExternalLink } from "lucide-react";
import { ContentRenderer } from "@/components/shared/content-renderer";
import { JsonLd } from "@/components/shared/json-ld";
import { RelatedContentLinks } from "@/components/shared/related-content-links";
import { Tag } from "@/components/shared/tag";
import { ProjectVisualPreview } from "@/components/shared/project-visual-preview";
import { TiltFrame } from "@/components/site/interactive";
import { getAllProjectSlugs, getAllProjects, getProjectBySlug } from "@/lib/content";
import { getAllCertificates } from "@/lib/db/queries/certificates";
import { getFirstContentImage, buildContentMetadata } from "@/lib/metadata";
import { getRelatedContent } from "@/lib/related-content";
import { buildArticleJsonLd } from "@/lib/structured-data";
import { formatDateShort } from "@/lib/utils";
import { getHomepageContent } from "@/lib/db/queries/homepage";

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
  const [certifications, allProjects, related, homepage] = await Promise.all([
    getAllCertificates(),
    getAllProjects(),
    getRelatedContent({ currentPath, tags: frontmatter.tags, category: frontmatter.category }),
    getHomepageContent(),
  ]);
  const aiNote = homepage.aiNote;
  const cert = certifications.find((certificate) => certificate.id === frontmatter.relatedCertification);
  const idx = allProjects.findIndex((entry) => entry.frontmatter.slug === frontmatter.slug);
  const prev = idx > 0 ? allProjects[idx - 1] : undefined;
  const next = idx >= 0 ? allProjects[idx + 1] : undefined;
  const projectImage = frontmatter.thumbnail ?? getFirstContentImage(content);
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

  const year = new Date(frontmatter.completionDate).getFullYear();
  const statusLabel = { completed: "Shipped", "in-progress": "In progress", planned: "Planned" }[frontmatter.status] ?? frontmatter.status;
  const facts = [
    { label: "Type", value: frontmatter.category },
    { label: "Status", value: statusLabel },
    { label: "Completed", value: formatDateShort(frontmatter.completionDate) },
    { label: "Stack", value: frontmatter.technologies.slice(0, 3).join(", ") || "—" },
  ];

  return (
    <div className="case-study">
      <JsonLd data={projectJsonLd} />

      <header className="case-hero">
        <Link href="/projects" className="case-back"><ArrowLeft size={15} /> All projects</Link>
        <p className="work-meta">
          <span className="work-index">Project {String(Math.max(0, idx) + 1).padStart(2, "0")}</span>
          <span>{frontmatter.category}</span>
          <span>{year}</span>
          {frontmatter.liveSiteUrl ? <span className="work-live"><i className="live-dot" /> Live</span> : null}
          {frontmatter.aiAssisted ? <span>{aiNote.short}</span> : null}
        </p>
        <h1>{frontmatter.title}</h1>
        <p className="case-summary">{frontmatter.summary}</p>
        {(frontmatter.liveSiteUrl || frontmatter.demoUrl || frontmatter.githubUrl) ? (
          <div className="case-actions">
            {frontmatter.liveSiteUrl ? <a href={frontmatter.liveSiteUrl} target="_blank" rel="noreferrer" className="btn btn-solid">Visit live site <ExternalLink size={15} /></a> : null}
            {frontmatter.demoUrl ? <a href={frontmatter.demoUrl} target="_blank" rel="noreferrer" className="btn btn-ghost">Watch demo <ExternalLink size={15} /></a> : null}
            {frontmatter.githubUrl ? <a href={frontmatter.githubUrl} target="_blank" rel="noreferrer" className="btn btn-ghost"><Github size={15} /> Source code</a> : null}
          </div>
        ) : null}
        <dl className="case-facts">
          {facts.map((fact) => (
            <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
          ))}
        </dl>
      </header>

      {projectImage ? (
        <div className="case-media">
          <TiltFrame>
            <ProjectVisualPreview title={frontmatter.title} liveSiteUrl={frontmatter.liveSiteUrl} thumbnail={projectImage} priority />
          </TiltFrame>
        </div>
      ) : null}

      <div className="case-layout">
        <article className="case-main">
          <ContentRenderer
            content={content}
            context={{ model: "Project", id: project.recordId, slug: frontmatter.slug, title: frontmatter.title }}
          />

          <RelatedContentLinks items={related} />

          <nav className="case-pager" aria-label="More projects">
            {prev ? (
              <Link href={`/projects/${prev.frontmatter.slug}`}><small><ArrowLeft size={13} /> Previous</small><strong>{prev.frontmatter.title}</strong></Link>
            ) : <span />}
            {next ? (
              <Link href={`/projects/${next.frontmatter.slug}`}><small>Next <ArrowRight size={13} /></small><strong>{next.frontmatter.title}</strong></Link>
            ) : null}
          </nav>
        </article>

        <aside className="case-aside">
          {frontmatter.aiAssisted ? (
            <section>
              <p className="footer-label">How this was built</p>
              <p className="ai-note">{aiNote.long}</p>
            </section>
          ) : null}

          {frontmatter.technologies.length ? (
            <section>
              <p className="footer-label">Built with</p>
              <ul className="chip-list">{frontmatter.technologies.map((technology) => <li key={technology}>{technology}</li>)}</ul>
            </section>
          ) : null}

          {frontmatter.skills.length ? (
            <section>
              <p className="footer-label">Skills applied</p>
              <ul className="chip-list">{frontmatter.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
            </section>
          ) : null}

          {frontmatter.tags.length ? (
            <section>
              <p className="footer-label">Topics</p>
              <div className="flex flex-wrap gap-1.5">{frontmatter.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</div>
            </section>
          ) : null}

          {(frontmatter.downloads?.length || cert) ? (
            <section>
              <p className="footer-label">Resources</p>
              {frontmatter.downloads?.map((download) => (
                <a key={`${download.label}-${download.href}`} href={download.href} className="case-resource" download>
                  {download.type === "config" ? <FileText size={14} /> : <Download size={14} />}{download.label}
                </a>
              ))}
              {cert ? <Link href="/certifications" className="case-resource">{cert.name}</Link> : null}
            </section>
          ) : null}

          <section>
            <p className="footer-label">Interested?</p>
            <Link href="/contact" className="btn btn-solid btn-sm">Talk to me about this</Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
