import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader, PageShell } from "@/components/shared/page-header";
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
        eyebrow="Thought Space"
        title="Journal"
        description="Notes from web development, networking, security, and broader technical learning — practical, dated, and tied back to hands-on work."
      />
      <PageShell>
        <div className="journal-index-list">
          {articles.map((article, index) => (
            <Link key={article.frontmatter.slug} href={`/journal/${article.frontmatter.slug}`} className="journal-index-row">
              <span className="journal-index-number">{String(index + 1).padStart(2, "0")}</span>
              <time>{formatDate(article.frontmatter.date)}</time>
              <div className="journal-index-copy">
                <span>{article.frontmatter.category}</span>
                <h2>{article.frontmatter.title}</h2>
                <p>{article.frontmatter.summary}</p>
              </div>
              <span className="journal-index-time">{article.readingTime}</span>
              <ArrowUpRight size={17} className="journal-index-arrow" />
            </Link>
          ))}
        </div>
      </PageShell>
    </div>
  );
}
