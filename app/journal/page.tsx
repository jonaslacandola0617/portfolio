import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader, PageShell } from "@/components/shared/page-header";
import { Tag } from "@/components/shared/tag";
import { getAllArticles } from "@/lib/content";
import { buildStaticPageMetadata } from "@/lib/metadata";
import { formatDate } from "@/lib/utils";

export const metadata = buildStaticPageMetadata({
  title: "Web Development, IT & Networking Learning Journal",
  description:
    "A practical technical learning journal covering web development, PHP, Laravel, React, Next.js, networking, CCNA, cybersecurity, Linux, and hands-on problem solving.",
  path: "/journal",
  keywords: [
    "web development learning journal",
    "PHP learning notes",
    "Laravel learning notes",
    "React learning notes",
    "Next.js learning notes",
    "CCNA notes",
    "networking notes",
    "cybersecurity learning journal",
    "technical learning journal",
  ],
});

export default async function JournalPage() {
  const articles = await getAllArticles();
  return (
    <div>
      <PageHeader
        index="04"
        eyebrow="Learning Journal"
        title="Journal"
        description="Notes from web development, networking, security, and broader technical learning — practical, dated, and tied back to hands-on work."
      />
      <PageShell>
        <div className="divide-y divide-border border-y border-border">
          {articles.map((article, index) => (
            <article key={article.frontmatter.slug} className="py-6">
              <Link
                href={`/journal/${article.frontmatter.slug}`}
                className="group grid gap-3 sm:grid-cols-[36px_110px_1fr_auto] sm:items-start"
              >
                <span className="idx">{String(index + 1).padStart(2, "0")}</span>
                <time className="font-mono text-xs text-muted-foreground">
                  {formatDate(article.frontmatter.date)}
                </time>
                <div>
                  <h2 className="font-display text-lg font-semibold text-text transition-colors group-hover:text-cobalt">
                    {article.frontmatter.title}
                  </h2>
                  <p className="mt-1.5 text-sm text-text-dim">{article.frontmatter.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {article.frontmatter.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="label">{article.readingTime}</span>
                  <ArrowUpRight
                    size={14}
                    className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cobalt"
                  />
                </div>
              </Link>
            </article>
          ))}
        </div>
      </PageShell>
    </div>
  );
}
