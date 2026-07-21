import Link from "next/link";
import { Plus, GitCommitHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/admin/empty-state";
import { getAllTimelineForAdmin } from "@/lib/services/timeline-admin-service";
import { formatDate } from "@/lib/utils";

const statusVariant = { DRAFT: "default", PUBLISHED: "success", ARCHIVED: "outline", SCHEDULED: "warning" } as const;

export default async function AdminTimelinePage() {
  const entries = await getAllTimelineForAdmin();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Timeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">{entries.length} total</p>
        </div>
        <Button asChild>
          <Link href="/admin/timeline/new"><Plus className="h-4 w-4" /> New entry</Link>
        </Button>
      </div>

      {entries.length === 0 ? (
        <EmptyState icon={GitCommitHorizontal} title="No timeline entries yet" description="Add your first milestone to get started." />
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {entries.map((e) => (
            <Link key={e.id} href={`/admin/timeline/${e.id}`} className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-accent">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{e.title}</div>
                <div className="mt-0.5 font-mono text-[0.68rem] text-muted-foreground">
                  {formatDate(e.date.toISOString().slice(0, 10))}
                </div>
              </div>
              <Badge variant={statusVariant[e.publishStatus as keyof typeof statusVariant]}>{e.publishStatus}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
