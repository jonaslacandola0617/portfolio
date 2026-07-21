import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FolderGit2, FlaskConical, NotebookPen, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { getAllProjects, getAllLabs, getAllArticles, getAllTags } from "@/lib/content";
import { slugify } from "@/lib/utils";

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map(({ tag }) => ({ tag: slugify(tag) }));
}

export function generateMetadata({ params }: { params: { tag: string } }): Metadata {
  return { title: `#${params.tag}` };
}

export default async function TagPage({ params }: { params: { tag: string } }) {
  const [allProjects, allLabs, allArticles] = await Promise.all([
    getAllProjects(),
    getAllLabs(),
    getAllArticles(),
  ]);
  const projects = allProjects.filter((p) =>
    p.frontmatter.tags.some((t) => slugify(t) === params.tag)
  );
  const labs = allLabs.filter((l) => l.frontmatter.tags.some((t) => slugify(t) === params.tag));
  const articles = allArticles.filter((a) =>
    a.frontmatter.tags.some((t) => slugify(t) === params.tag)
  );

  const total = projects.length + labs.length + articles.length;
  if (total === 0) notFound();

  const originalTag =
    projects[0]?.frontmatter.tags.find((t) => slugify(t) === params.tag) ??
    labs[0]?.frontmatter.tags.find((t) => slugify(t) === params.tag) ??
    articles[0]?.frontmatter.tags.find((t) => slugify(t) === params.tag) ??
    params.tag;

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
                <li key={p.frontmatter.slug}>
                  <Link href={`/projects/${p.frontmatter.slug}`} className="text-sm text-foreground hover:text-primary">
                    {p.frontmatter.title}
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
                <li key={l.frontmatter.slug}>
                  <Link href={`/labs/${l.frontmatter.slug}`} className="text-sm text-foreground hover:text-primary">
                    {l.frontmatter.title}
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
                <li key={a.frontmatter.slug}>
                  <Link href={`/journal/${a.frontmatter.slug}`} className="text-sm text-foreground hover:text-primary">
                    {a.frontmatter.title}
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
