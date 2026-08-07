import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ContentRenderer } from "@/components/shared/content-renderer";
import { TableOfContents } from "@/components/shared/table-of-contents";
import { Tag } from "@/components/shared/tag";
import { getAllArticles, getAllArticleSlugs, getArticleBySlug } from "@/lib/content";
import { extractContentHeadings } from "@/lib/content-headings";
import { formatDate } from "@/lib/utils";

export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  return article
    ? { title: article.frontmatter.title, description: article.frontmatter.summary }
    : {};
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticleBySlug(params.slug);
  if (!article) notFound();

  const { frontmatter, content, readingTime } = article;
  const tocItems = extractContentHeadings(content);
  const all = await getAllArticles();
  const related = all
    .filter((entry) => entry.frontmatter.slug !== frontmatter.slug)
    .filter((entry) => entry.frontmatter.tags.some((tag) => frontmatter.tags.includes(tag)))
    .slice(0, 2);

  return (
    <div>
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

          <div className="mt-8 flex flex-wrap gap-1.5 border-t border-border pt-6">
            {frontmatter.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>

          {related.length > 0 && (
            <div className="mt-12">
              <p className="idx mb-4">Related Journal Entries</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {related.map((entry) => (
                  <Link
                    key={entry.frontmatter.slug}
                    href={`/journal/${entry.frontmatter.slug}`}
                    className="border border-border bg-surface-2 p-4 transition-colors hover:border-border-strong"
                  >
                    <p className="label mb-1.5">{entry.frontmatter.category}</p>
                    <p className="font-display text-sm font-semibold text-text">
                      {entry.frontmatter.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </main>

        <TableOfContents items={tocItems} />
      </div>
    </div>
  );
}
