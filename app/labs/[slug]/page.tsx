import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { LabTopology } from "@/components/site/lab-topology";
import { ContentRenderer } from "@/components/shared/content-renderer";
import { JsonLd } from "@/components/shared/json-ld";
import { RelatedContentLinks } from "@/components/shared/related-content-links";
import { TableOfContents } from "@/components/shared/table-of-contents";
import { Tag } from "@/components/shared/tag";
import { StatusBadge } from "@/components/shared/status-badges";
import { getAllLabSlugs, getLabBySlug } from "@/lib/content";
import { extractContentHeadings, type ContentHeading } from "@/lib/content-headings";
import { buildContentMetadata, getFirstContentImage } from "@/lib/metadata";
import { getRelatedContent } from "@/lib/related-content";
import { buildArticleJsonLd } from "@/lib/structured-data";
import { formatDate, formatDateShort } from "@/lib/utils";

type LabParams = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const slugs = await getAllLabSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: LabParams }): Promise<Metadata> {
  const { slug } = await params;
  const lab = await getLabBySlug(slug);
  if (!lab) return {};
  const { frontmatter, content } = lab;
  return buildContentMetadata({
    title: frontmatter.title,
    description: frontmatter.purpose,
    path: `/labs/${frontmatter.slug}`,
    typeLabel: "Lab",
    image: getFirstContentImage(content),
    publishedTime: frontmatter.date,
    modifiedTime: frontmatter.lastUpdated,
    tags: [frontmatter.category, ...frontmatter.tags],
  });
}

export default async function LabPage({ params }: { params: LabParams }) {
  const { slug } = await params;
  const lab = await getLabBySlug(slug);
  if (!lab) notFound();

  const { frontmatter, content } = lab;
  const currentPath = `/labs/${frontmatter.slug}`;
  const related = await getRelatedContent({ currentPath, tags: frontmatter.tags, category: frontmatter.category });
  const contentHeadings = extractContentHeadings(content);
  const tocItems: ContentHeading[] = [
    ...contentHeadings,
    ...(frontmatter.downloads?.length ? ([{ id: "lab-resources", text: "Resources", level: 2 }] satisfies ContentHeading[]) : []),
  ];
  const labImage = getFirstContentImage(content);
  const labJsonLd = buildArticleJsonLd({
    type: "TechArticle",
    title: frontmatter.title,
    description: frontmatter.purpose,
    path: currentPath,
    image: labImage,
    publishedTime: frontmatter.date,
    modifiedTime: frontmatter.lastUpdated,
    category: frontmatter.category,
    tags: frontmatter.tags,
  });

  const statusLabel = { completed: "Completed", "in-progress": "In progress", planned: "Planned" }[frontmatter.status] ?? frontmatter.status;
  const facts = [
    { label: "Type", value: "Hands-on lab" },
    { label: "Area", value: frontmatter.category },
    { label: "Status", value: statusLabel },
    { label: "Date", value: formatDateShort(frontmatter.date) },
  ];

  return (
    <div className="case-study">
      <JsonLd data={labJsonLd} />

      <header className="case-hero">
        <Link href="/labs" className="case-back"><ArrowLeft size={15} /> All labs</Link>
        <div className="case-hero-grid">
          <div>
            <p className="work-meta">
              <span className="work-index">Lab</span>
              <span>{frontmatter.category}</span>
              <StatusBadge status={frontmatter.status} />
            </p>
            <h1>{frontmatter.title}</h1>
            <p className="case-summary">{frontmatter.purpose}</p>
          </div>
          <div className="case-topology" aria-hidden="true"><LabTopology seed={frontmatter.slug} className="lab-topology" /></div>
        </div>
        <dl className="case-facts">
          {facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
        </dl>
      </header>

      <div className="case-layout">
        <article className="case-main">
          <ContentRenderer
            content={content}
            context={{ model: "Lab", id: lab.recordId, slug: frontmatter.slug, title: frontmatter.title }}
          />

          {frontmatter.downloads?.length ? (
            <section id="lab-resources" className="case-resources">
              <h2>Resources</h2>
              <ul>
                {frontmatter.downloads.map((download) => (
                  <li key={`${download.href}-${download.label}`}>
                    <a href={download.href} download><Download size={16} aria-hidden="true" /><span>{download.label}</span><small>Download</small></a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <RelatedContentLinks items={related} />
        </article>

        <aside className="case-aside">
          <TableOfContents items={tocItems} />
          {frontmatter.tags.length ? (
            <section>
              <p className="footer-label">Topics</p>
              <div className="tag-list">{frontmatter.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</div>
            </section>
          ) : null}
          <section>
            <p className="footer-label">Last updated</p>
            <p className="case-aside-note">{formatDate(frontmatter.lastUpdated)}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
