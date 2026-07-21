import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import { ContentRenderer } from "@/components/shared/content-renderer";
import { TableOfContents } from "@/components/shared/table-of-contents";
import { ReadingProgress } from "@/components/shared/reading-progress";
import { RelatedContent } from "@/components/shared/related-content";
import { Tag } from "@/components/shared/tag";
import { StatusBadge, DifficultyBadge } from "@/components/shared/status-badges";
import { Badge } from "@/components/ui/badge";
import { getAllLabSlugs, getAllLabs, getLabBySlug } from "@/lib/content";
import { formatDate } from "@/lib/utils";

export async function generateStaticParams() {
  const slugs = await getAllLabSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const lab = await getLabBySlug(params.slug);
  if (!lab) return {};
  return { title: lab.frontmatter.title, description: lab.frontmatter.purpose };
}

export default async function LabPage({ params }: { params: { slug: string } }) {
  const lab = await getLabBySlug(params.slug);
  if (!lab) notFound();

  const { frontmatter, content } = lab;
  const allLabs = await getAllLabs();
  const related = allLabs
    .filter((l) => l.frontmatter.slug !== frontmatter.slug)
    .filter((l) => l.frontmatter.tags.some((t) => frontmatter.tags.includes(t)))
    .slice(0, 4);

  return (
    <div>
      <ReadingProgress />
      <div className="mx-auto max-w-6xl px-6 py-14 md:px-10">
        <Link
          href="/labs"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to labs
        </Link>

        <div className="grid gap-10 lg:grid-cols-[1fr_240px]">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={frontmatter.status} />
              <DifficultyBadge difficulty={frontmatter.difficulty} />
              <Badge variant="outline">{frontmatter.category}</Badge>
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl text-balance">
              {frontmatter.title}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">{frontmatter.purpose}</p>

            <div className="mt-5 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> {formatDate(frontmatter.date)}
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
              title="Related Labs"
              items={related.map((l) => ({
                title: l.frontmatter.title,
                href: `/labs/${l.frontmatter.slug}`,
                meta: formatDate(l.frontmatter.date),
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
