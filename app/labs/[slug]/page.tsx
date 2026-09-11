import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
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
import { formatDate } from "@/lib/utils";

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
    { id: "lab-objective", text: "Objective", level: 2 },
    { id: "lab-record", text: "Lab Record", level: 2 },
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

  return (
    <div className="public-lab-detail">
      <JsonLd data={labJsonLd} />

      <header className="public-detail-hero public-lab-hero">
        <div className="public-detail-hero-inner">
          <Link href="/labs" className="public-detail-back"><ArrowLeft size={12} /> All labs</Link>
          <div className="public-detail-kicker">
            <span>LAB / TECHNICAL RECORD</span>
            <span className="accent">{frontmatter.category}</span>
            <StatusBadge status={frontmatter.status} />
            <span>{formatDate(frontmatter.date)}</span>
          </div>
          <h1 className="public-detail-title">{frontmatter.title}</h1>
          <div className="public-detail-line" aria-hidden="true"><span /></div>
        </div>
      </header>

      <div className="public-lab-layout">
        <main className="min-w-0">
          <section id="lab-objective" className="public-lab-objective scroll-mt-28">
            <small>01 / Objective</small>
            <p>{frontmatter.purpose}</p>
          </section>

          <section id="lab-record" className="scroll-mt-28">
            <p className="public-lab-record-label">02 / Lab record</p>
            <div className="mt-6">
              <ContentRenderer
                content={content}
                context={{ model: "Lab", id: lab.recordId, slug: frontmatter.slug, title: frontmatter.title }}
              />
            </div>
          </section>

          {frontmatter.downloads?.length ? (
            <section id="lab-resources" className="public-detail-tech scroll-mt-28">
              <p>03 / Resources</p>
              <div className="mt-3 divide-y divide-border">
                {frontmatter.downloads.map((download) => (
                  <a key={`${download.href}-${download.label}`} href={download.href} download className="public-detail-resource py-3">
                    <Download size={13} /><span className="flex-1">{download.label}</span><span className="font-mono text-[8px] uppercase">Download</span>
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <div className="public-detail-tech">
            <p>Tags</p>
            <div className="mt-3 flex flex-wrap gap-1.5">{frontmatter.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</div>
          </div>

          <RelatedContentLinks items={related} />
        </main>

        <aside className="public-detail-aside"><TableOfContents items={tocItems} /></aside>
      </div>
    </div>
  );
}
