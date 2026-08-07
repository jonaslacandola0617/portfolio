import { ManagementList, type ManagementListRow } from "@/components/admin/management-list";
import { getAllTimelineForAdmin } from "@/lib/services/timeline-admin-service";
import { formatDate } from "@/lib/utils";
import { deleteTimelineAction, bulkDeleteTimelineAction } from "@/app/admin/(dashboard)/timeline/actions";

export default async function AdminTimelinePage() {
  const entries = await getAllTimelineForAdmin();
  const rows: ManagementListRow[] = entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    meta: entry.category,
    status: entry.publishStatus,
    updated: formatDate(entry.date.toISOString().slice(0, 10)),
  }));

  return (
    <ManagementList
      index="09"
      title="Timeline"
      eyebrow="Document milestones and progress."
      rows={rows}
      basePath="/admin/timeline"
      newHref="/admin/timeline/new"
      itemLabelSingular="entry"
      itemLabelPlural="entries"
      deleteOneAction={deleteTimelineAction}
      deleteManyAction={bulkDeleteTimelineAction}
    />
  );
}
