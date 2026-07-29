import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TimelineForm } from "@/components/admin/timeline-form";

export default function NewTimelinePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 md:px-10">
      <Link href="/admin/timeline" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to timeline
      </Link>
      <h1 className="font-display text-2xl font-semibold text-foreground">New timeline entry</h1>
      <p className="mb-6 mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
        Add a dated milestone and choose whether it should appear on the public
        timeline.
      </p>
      <TimelineForm mode="create" />
    </div>
  );
}
