import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader, PageShell } from "@/components/shared/page-header";
import { getAllArticles } from "@/lib/content";
import { buildStaticPageMetadata } from "@/lib/metadata";
import { formatDateShort } from "@/lib/utils";

export const metadata = buildStaticPageMetadata({
  title: "IT, Networking & Security Learning Journal",
  description:
    "Notes on networking, CCNA, cybersecurity, Active Directory, Linux and troubleshooting by Jonas Lacandola: what I learned, what broke, and how I fixed it.",
  path: "/journal",
  keywords: [
    "CCNA notes",
    "networking notes",
    "cybersecurity learning journal",
    "Active Directory notes",
    "IT support notes",
    "technical learning journal",
  ],
});

export default async function JournalPage() {
  const articles = await getAllArticles();
  return (
    <div>
      <PageHeader
        index="Writing"
        eyebrow={`${articles.length} ${articles.length === 1 ? "entry" : "entries"}`}
        title="Notes from the work."
        description="What I learned while studying and building: networking, security and troubleshooting, written in plain language and dated."
      />
      <PageShell>
        {articles.length ? (
          <ol className="writing-list">
            {articles.map((article) => {
              const fm = article.frontmatter;
              const category = fm.category && fm.category !== "Uncategorized" ? fm.category : null;
              return (
                <li key={fm.slug}>
                  <Link href={`/journal/${fm.slug}`} className="writing-row">
                    <time dateTime={fm.date}>{formatDateShort(fm.date)}</time>
                    <span className="writing-copy">
                      <h2>{fm.title}</h2>
                      <p>{fm.summary}</p>
                      <span className="writing-meta">
                        {category ? <span>{category}</span> : null}
                        <span>{article.readingTime}</span>
                      </span>
                    </span>
                    <ArrowUpRight size={18} aria-hidden="true" className="writing-arrow" />
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="muted">No published entries yet.</p>
        )}
      </PageShell>
    </div>
  );
}
