import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FolderGit2, FlaskConical, NotebookPen, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { getAllPublishedTags, getPublishedContentByTagSlug } from "@/lib/db/queries/tags";

export async function generateStaticParams() {
  const tags = await getAllPublishedTags();
  return tags.map(({ slug }) => ({ tag: slug }));
}

export function generateMetadata({ params }: { params: { tag: string } }): Metadata {
  return { title: `#${params.tag}` };
}

export default async function TagPage({ params }: { params: { tag: string } }) {
  const tagged = await getPublishedContentByTagSlug(params.tag);
  if (!tagged) notFound();

  const { projects, labs, articles } = tagged;
  const total = projects.length + labs.length + articles.length;
  if (total === 0) notFound();

  const originalTag = tagged.tag.name;

  return (
    <div className="mx-auto max-w-3xl px-6 py-14 md:px-10">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back home
      </Link>
      <PageHeader eyebrow="Tag" title={`#${originalTag}`} description={`${total} item${total === 1 ? "" : "s"} tagged across projects, labs, and journal entries.`} />

      <div className="space-y-8">
        {projects.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <FolderGit2 className="h-4 w-4" /> Projects
            </h2>
            <ul className="space-y-2">
              {projects.map((p) => (
                <li key={p.slug}>
                  <Link href={`/projects/${p.slug}`} className="text-sm text-foreground hover:text-primary">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {labs.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <FlaskConical className="h-4 w-4" /> Labs
            </h2>
            <ul className="space-y-2">
              {labs.map((l) => (
                <li key={l.slug}>
                  <Link href={`/labs/${l.slug}`} className="text-sm text-foreground hover:text-primary">
                    {l.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {articles.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <NotebookPen className="h-4 w-4" /> Journal
            </h2>
            <ul className="space-y-2">
              {articles.map((a) => (
                <li key={a.slug}>
                  <Link href={`/journal/${a.slug}`} className="text-sm text-foreground hover:text-primary">
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
