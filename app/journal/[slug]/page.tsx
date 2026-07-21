import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { ContentRenderer } from "@/components/shared/content-renderer";
import { TableOfContents } from "@/components/shared/table-of-contents";
import { ReadingProgress } from "@/components/shared/reading-progress";
import { RelatedContent } from "@/components/shared/related-content";
import { Tag } from "@/components/shared/tag";
import { getAllArticles, getAllArticleSlugs, getArticleBySlug } from "@/lib/content";
import { formatDate } from "@/lib/utils";

export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article) return {};
  return { title: article.frontmatter.title, description: article.frontmatter.summary };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticleBySlug(params.slug);
  if (!article) notFound();

  const { frontmatter, content, readingTime } = article;
  const allArticles = await getAllArticles();
  const related = allArticles
    .filter((a) => a.frontmatter.slug !== frontmatter.slug)
    .filter((a) => a.frontmatter.tags.some((t) => frontmatter.tags.includes(t)))
    .slice(0, 4);

  return (
    <div>
      <ReadingProgress />
      <div className="mx-auto max-w-6xl px-6 py-14 md:px-10">
        <Link
          href="/journal"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to journal
        </Link>

        <div className="grid gap-10 lg:grid-cols-[1fr_240px]">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl text-balance">
              {frontmatter.title}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">{frontmatter.summary}</p>

            <div className="mt-5 flex items-center gap-4 font-mono text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> {formatDate(frontmatter.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {readingTime}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {frontmatter.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>

            <div id="article-content" className="mt-10">
              <ContentRenderer content={content} />
            </div>

            <RelatedContent
              title="Related Entries"
              items={related.map((a) => ({
                title: a.frontmatter.title,
                href: `/journal/${a.frontmatter.slug}`,
                meta: formatDate(a.frontmatter.date),
              }))}
            />
          </div>

          <aside className="hidden lg:block">
            <TableOfContents />
          </aside>
        </div>
      </div>
    </div>
  );
}
