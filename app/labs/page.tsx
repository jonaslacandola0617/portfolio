import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { LabCard } from "@/components/shared/lab-card";
import { getAllLabs } from "@/lib/content";

export const metadata: Metadata = { title: "Labs" };

export default async function LabsPage() {
  const labs = await getAllLabs();

  return (
    <div className="mx-auto max-w-6xl px-6 py-14 md:px-10">
      <PageHeader
        eyebrow="Lab Notebook"
        title="Labs"
        description="A chronological log of hands-on labs — purpose, commands, what went wrong, and what fixed it. Logged close to when the work happened, mistakes included."
      />

      {labs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No published labs yet.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {labs.map((l) => (
            <LabCard key={l.frontmatter.slug} lab={l.frontmatter} />
          ))}
        </div>
      )}
    </div>
  );
}
