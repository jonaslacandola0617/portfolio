import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader, PageShell, SectionLabel } from "@/components/shared/page-header";
import { getAllPublishedTags, getPublishedContentByTagSlug } from "@/lib/db/queries/tags";
import { buildStaticPageMetadata } from "@/lib/metadata";

type TagParams = Promise<{ tag: string }>;

export async function generateStaticParams() {
  const tags = await getAllPublishedTags();
  return tags.map(({ slug }) => ({ tag: slug }));
}

export async function generateMetadata({ params }: { params: TagParams }): Promise<Metadata> {
  const { tag } = await params;
  const tagged = await getPublishedContentByTagSlug(tag);
  if (!tagged) return { robots: { index: false, follow: false } };

  const total = tagged.projects.length + tagged.labs.length + tagged.articles.length;
  const metadata = buildStaticPageMetadata({
    title: `${tagged.tag.name} — Projects, Labs & Journal`,
    description: `Browse ${total} published portfolio ${total === 1 ? "entry" : "entries"} about ${tagged.tag.name}, including hands-on projects, technical labs, and learning journal notes.`,
    path: `/tags/${tagged.tag.slug}`,
    keywords: [tagged.tag.name, `${tagged.tag.name} projects`, `${tagged.tag.name} labs`],
  });

  return {
    ...metadata,
    robots: {
      index: total >= 2,
      follow: true,
    },
  };
}

export default async function TagPage({ params }: { params: TagParams }) {
  const { tag } = await params;
  const tagged = await getPublishedContentByTagSlug(tag);
  if (!tagged) notFound();
  const { projects, labs, articles } = tagged;
  const total = projects.length + labs.length + articles.length;
  if (total === 0) notFound();

  const groups = [
    {
      index: "01",
      label: "Projects",
      items: projects.map((item) => ({ title: item.title, href: `/projects/${item.slug}` })),
    },
    {
      index: "02",
      label: "Labs",
      items: labs.map((item) => ({ title: item.title, href: `/labs/${item.slug}` })),
    },
    {
      index: "03",
      label: "Journal",
      items: articles.map((item) => ({ title: item.title, href: `/journal/${item.slug}` })),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <div>
      <PageHeader
        index="00"
        eyebrow="Tag Index"
        title={`#${tagged.tag.name}`}
        description={`Browse ${total} published ${total === 1 ? "entry" : "entries"} related to ${tagged.tag.name} across projects, labs, and the learning journal.`}
      />
      <PageShell>
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-xs text-muted hover:text-text"
        >
          <ArrowLeft size={12} /> Back home
        </Link>
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.label}>
              <SectionLabel index={group.index} title={group.label} />
              <div className="divide-y divide-border border-y border-border">
                {group.items.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center gap-4 px-1 py-4"
                  >
                    <span className="idx w-7 shrink-0">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-base font-medium text-text transition-colors group-hover:text-cobalt">
                      {item.title}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </PageShell>
    </div>
  );
}
