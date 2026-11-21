import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, FlaskConical, FolderGit2, BookOpen } from "lucide-react";
import { PageHeader, PageShell } from "@/components/shared/page-header";
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
    { label: "Labs", icon: FlaskConical, items: labs.map((item) => ({ title: item.title, href: `/labs/${item.slug}` })) },
    { label: "Projects", icon: FolderGit2, items: projects.map((item) => ({ title: item.title, href: `/projects/${item.slug}` })) },
    { label: "Writing", icon: BookOpen, items: articles.map((item) => ({ title: item.title, href: `/journal/${item.slug}` })) },
  ].filter((group) => group.items.length > 0);

  return (
    <div>
      <PageHeader
        index="Topic"
        eyebrow={`${total} ${total === 1 ? "item" : "items"}`}
        title={tagged.tag.name}
        description={`Everything on this site about ${tagged.tag.name}: labs, projects and writing.`}
      />
      <PageShell>
        <div className="topic-groups">
          {groups.map((group) => (
            <section key={group.label} className="topic-group" aria-labelledby={`topic-${group.label}`}>
              <h2 id={`topic-${group.label}`}><group.icon size={18} aria-hidden="true" /> {group.label} <span>{group.items.length}</span></h2>
              <ul>
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>{item.title}<ArrowUpRight size={16} aria-hidden="true" /></Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </PageShell>
    </div>
  );
}
