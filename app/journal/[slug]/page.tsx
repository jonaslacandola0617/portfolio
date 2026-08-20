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
import {
  extractContentHeadings,
  type ContentHeading,
} from "@/lib/content-headings";
import { buildContentMetadata, getFirstContentImage } from "@/lib/metadata";
import { getRelatedContent } from "@/lib/related-content";
import { buildArticleJsonLd } from "@/lib/structured-data";
import { formatDate } from "@/lib/utils";

type ArticleParams = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: ArticleParams;
}): Promise<Metadata> {
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
    ...(frontmatter.downloads?.length
      ? ([{ id: "journal-resources", text: "Resources", level: 2 }] satisfies ContentHeading[])
      : []),
  ];
  const related = await getRelatedContent({
    currentPath,
    tags: frontmatter.tags,
    category: frontmatter.category,
  });
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
    <div>
      <JsonLd data={articleJsonLd} />
      <header className="border-b border-border px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <Link
              href="/journal"
              className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-text"
            >
              <ArrowLeft size={12} /> All Journal Entries
            </Link>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="label text-cobalt">{frontmatter.category}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {formatDate(frontmatter.date)}
              </span>
              <span className="label">{readingTime}</span>
            </div>
            <h1 className="font-display text-3xl font-semibold leading-tight text-text sm:text-4xl">
              {frontmatter.title}
            </h1>
            <p className="mt-4 text-base text-text-dim">{frontmatter.summary}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-12 sm:px-10 lg:px-14 xl:grid-cols-[minmax(0,1fr)_220px]">
        <main className="min-w-0 max-w-2xl">
          <article className="max-w-content">
            <ContentRenderer
              content={content}
              context={{
                model: "Article",
                id: article.recordId,
                slug: frontmatter.slug,
                title: frontmatter.title,
              }}
            />
          </article>

          {frontmatter.downloads?.length ? (
            <section id="journal-resources" className="mt-10 scroll-mt-8">
              <p className="idx mb-4">Resources</p>
              <div className="divide-y divide-border border border-border bg-surface-2">
                {frontmatter.downloads.map((download) => (
                  <a
                    key={`${download.href}-${download.label}`}
                    href={download.href}
                    download
                    className="flex items-start gap-3 px-4 py-3 text-sm text-text-dim hover:text-text"
                  >
                    <Download size={14} className="mt-0.5 shrink-0 text-cobalt" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-text">{download.label}</span>
                      {download.description ? (
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                          {download.description}
                        </span>
                      ) : null}
                    </span>
                    <span className="label shrink-0">Download</span>
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-1.5 border-t border-border pt-6">
            {frontmatter.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>

          <RelatedContentLinks items={related} />
        </main>

        <TableOfContents items={tocItems} />
      </div>
    </div>
  );
}
