import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { Timeline } from "@/components/shared/timeline";
import { getAllTimelineEntries } from "@/lib/db/queries/timeline";

export const metadata: Metadata = { title: "Timeline" };

export default async function TimelinePage() {
  const entries = await getAllTimelineEntries();

  return (
    <div className="mx-auto max-w-3xl px-6 py-14 md:px-10">
      <PageHeader
        eyebrow="Timeline"
        title="Learning Journey"
        description="A running log of the path so far — month by month, in the order it actually happened."
      />
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No published timeline entries yet.</p>
      ) : (
        <Timeline entries={entries} />
      )}
    </div>
  );
}
