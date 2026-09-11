import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { ContentRenderer } from "@/components/shared/content-renderer";
import { JsonLd } from "@/components/shared/json-ld";
import { RelatedContentLinks } from "@/components/shared/related-content-links";
import { TableOfContents } from "@/components/shared/table-of-contents";
import { Tag } from "@/components/shared/tag";
import { getAllArticleSlugs, getArticleBySlug } from "@/lib/content";
import { extractContentHeadings, type ContentHeading } from "@/lib/content-headings";
import { buildContentMetadata, getFirstContentImage } from "@/lib/metadata";
import { getRelatedContent } from "@/lib/related-content";
import { buildArticleJsonLd } from "@/lib/structured-data";
import { formatDate } from "@/lib/utils";

type ArticleParams = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: ArticleParams }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  const { frontmatter, content } = article;
  return buildContentMetadata({
    title: frontmatter.title,
    description: frontmatter.summary,
    path: `/journal/${frontmatter.slug}`,
    typeLabel: "Journal",
    image: getFirstContentImage(content),
    publishedTime: frontmatter.date,
    modifiedTime: frontmatter.lastUpdated,
    tags: [frontmatter.category, ...frontmatter.tags],
  });
}

export default async function ArticlePage({ params }: { params: ArticleParams }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const { frontmatter, content, readingTime } = article;
  const currentPath = `/journal/${frontmatter.slug}`;
  const contentHeadings = extractContentHeadings(content);
  const tocItems: ContentHeading[] = [
    ...contentHeadings,
    ...(frontmatter.downloads?.length ? ([{ id: "journal-resources", text: "Resources", level: 2 }] satisfies ContentHeading[]) : []),
  ];
  const related = await getRelatedContent({ currentPath, tags: frontmatter.tags, category: frontmatter.category });
  const articleImage = getFirstContentImage(content);
  const articleJsonLd = buildArticleJsonLd({
    type: "BlogPosting",
    title: frontmatter.title,
    description: frontmatter.summary,
    path: currentPath,
    image: articleImage,
    publishedTime: frontmatter.date,
    modifiedTime: frontmatter.lastUpdated,
    category: frontmatter.category,
    tags: frontmatter.tags,
  });

  return (
    <div className="public-journal-detail">
      <JsonLd data={articleJsonLd} />

      <header className="public-journal-hero">
        <div className="public-journal-hero-inner">
          <Link href="/journal" className="public-detail-back"><ArrowLeft size={12} /> All journal entries</Link>
          <div className="public-journal-meta">
            <span>Journal</span><span>{frontmatter.category}</span><span>{formatDate(frontmatter.date)}</span><span>{readingTime}</span>
          </div>
          <h1 className="public-journal-title">{frontmatter.title}</h1>
          <p className="public-journal-summary">{frontmatter.summary}</p>
        </div>
      </header>

      <div className="public-journal-layout">
        <main className="min-w-0">
          <article>
            <ContentRenderer
              content={content}
              context={{ model: "Article", id: article.recordId, slug: frontmatter.slug, title: frontmatter.title }}
            />
          </article>

          {frontmatter.downloads?.length ? (
            <section id="journal-resources" className="public-detail-tech scroll-mt-28">
              <p>Resources</p>
              <div className="mt-3 divide-y divide-border">
                {frontmatter.downloads.map((download) => (
                  <a key={`${download.href}-${download.label}`} href={download.href} download className="public-detail-resource py-3">
                    <Download size={13} className="mt-0.5 shrink-0" />
                    <span className="min-w-0 flex-1"><span className="block">{download.label}</span>{download.description ? <span className="mt-1 block text-xs opacity-60">{download.description}</span> : null}</span>
                    <span className="font-mono text-[8px] uppercase">Download</span>
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <div className="public-detail-tech">
            <p>Topics</p>
            <div className="mt-3 flex flex-wrap gap-1.5">{frontmatter.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</div>
          </div>

          <RelatedContentLinks items={related} />
        </main>

        <aside className="public-detail-aside"><TableOfContents items={tocItems} /></aside>
      </div>
    </div>
  );
}
