import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TimelineForm } from "@/components/admin/timeline-form";
import { getTimelineEntryForEdit } from "@/lib/services/timeline-admin-service";

export default async function EditTimelinePage({ params }: { params: { id: string } }) {
  const entry = await getTimelineEntryForEdit(params.id);
  if (!entry) notFound();

  return (
    <div className="px-6 py-8 sm:px-10">
      <Link href="/admin/timeline" className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to timeline
      </Link>
      <h1 className="font-display text-2xl font-semibold text-text">{entry.title}</h1>
      <p className="mb-6 mt-1 text-sm leading-6 text-text-dim">
        Update this milestone’s date, description, category, and public
        visibility.
      </p>
      <TimelineForm
        mode="edit"
        entry={{
          id: entry.id,
          title: entry.title,
          description: entry.description,
          date: entry.date.toISOString().slice(0, 10),
          category: entry.category,
          publishStatus: entry.publishStatus,
          tags: entry.tags.map((t) => t.name),
          scheduledFor: entry.scheduledFor ? entry.scheduledFor.toISOString().slice(0, 16) : "",
        }}
      />
    </div>
  );
}
