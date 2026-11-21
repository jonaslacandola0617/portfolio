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
import { formatDate, formatDateShort } from "@/lib/utils";

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

  const category = frontmatter.category && frontmatter.category !== "Uncategorized" ? frontmatter.category : null;

  return (
    <div className="case-study case-study-article">
      <JsonLd data={articleJsonLd} />

      <header className="case-hero">
        <Link href="/journal" className="case-back"><ArrowLeft size={15} /> All writing</Link>
        <p className="work-meta">
          <span className="work-index">Writing</span>
          {category ? <span>{category}</span> : null}
          <span>{formatDateShort(frontmatter.date)}</span>
          <span>{readingTime}</span>
        </p>
        <h1>{frontmatter.title}</h1>
        <p className="case-summary">{frontmatter.summary}</p>
      </header>

      <div className="case-layout">
        <article className="case-main">
          <ContentRenderer
            content={content}
            context={{ model: "Article", id: article.recordId, slug: frontmatter.slug, title: frontmatter.title }}
          />

          {frontmatter.downloads?.length ? (
            <section id="journal-resources" className="case-resources">
              <h2>Resources</h2>
              <ul>
                {frontmatter.downloads.map((download) => (
                  <li key={`${download.href}-${download.label}`}>
                    <a href={download.href} download>
                      <Download size={16} aria-hidden="true" />
                      <span>{download.label}{download.description ? <em>{download.description}</em> : null}</span>
                      <small>Download</small>
                    </a>
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
            <p className="footer-label">Published</p>
            <p className="case-aside-note">{formatDate(frontmatter.date)}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
