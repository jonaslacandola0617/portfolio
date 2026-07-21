import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Tag } from "@/components/shared/tag";
import { getAllArticles } from "@/lib/content";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Journal" };

export default async function JournalPage() {
  const articles = await getAllArticles();

  return (
    <div className="mx-auto max-w-3xl px-6 py-14 md:px-10">
      <PageHeader
        eyebrow="Learning Journal"
        title="Journal"
        description="Notes on networking and security concepts, written as I learn them — subnetting, the OSI model, DNS, and reflections on the Google Cybersecurity coursework."
      />

      <div className="divide-y divide-border border-t border-border">
        {articles.map((a) => (
          <article key={a.frontmatter.slug} className="py-6">
            <Link href={`/journal/${a.frontmatter.slug}`} className="group block">
              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <time>{formatDate(a.frontmatter.date)}</time>
                <span>&middot;</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {a.readingTime}
                </span>
              </div>
              <h2 className="mt-2 font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {a.frontmatter.title}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{a.frontmatter.summary}</p>
            </Link>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {a.frontmatter.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
