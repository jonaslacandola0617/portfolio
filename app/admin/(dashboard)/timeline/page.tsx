import Link from "next/link";
import { Plus, GitCommitHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";
import { QuerySuccessToast } from "@/components/admin/query-success-toast";
import { ManagementList, type ManagementListRow } from "@/components/admin/management-list";
import { getAllTimelineForAdmin } from "@/lib/services/timeline-admin-service";
import { formatDate } from "@/lib/utils";
import { deleteTimelineAction, bulkDeleteTimelineAction } from "./actions";

const statusVariant = { DRAFT: "default", PUBLISHED: "success", ARCHIVED: "outline", SCHEDULED: "warning" } as const;

export default async function AdminTimelinePage() {
  const entries = await getAllTimelineForAdmin();

  const rows: ManagementListRow[] = entries.map((e) => ({
    id: e.id,
    title: e.title,
    subtitle: formatDate(e.date.toISOString().slice(0, 10)),
    badgeLabel: e.publishStatus,
    badgeVariant: statusVariant[e.publishStatus as keyof typeof statusVariant],
  }));

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Timeline</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage the milestones shown on the public timeline and control
            which entries are visible to visitors. {entries.length} total.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/timeline/new"><Plus className="h-4 w-4" /> New entry</Link>
        </Button>
      </div>

      <QuerySuccessToast
        messages={{
          created: "Timeline entry created.",
          updated: "Timeline entry updated.",
        }}
      />

      {entries.length === 0 ? (
        <EmptyState icon={GitCommitHorizontal} title="No timeline entries yet" description="Add a dated milestone to document education, certifications, projects, or professional progress." />
      ) : (
        <ManagementList
          rows={rows}
          basePath="/admin/timeline"
          itemLabelSingular="entry"
          itemLabelPlural="entries"
          deleteOneAction={deleteTimelineAction}
          deleteManyAction={bulkDeleteTimelineAction}
        />
      )}
    </div>
  );
}
