import { ManagementList, type ManagementListRow } from "@/components/admin/management-list";
import { getAllLabsForAdmin } from "@/lib/services/lab-admin-service";
import { formatDate } from "@/lib/utils";
import { deleteLabAction, bulkDeleteLabsAction } from "@/app/admin/(dashboard)/labs/actions";

export default async function AdminLabsPage() {
  const items = await getAllLabsForAdmin();
  const rows: ManagementListRow[] = items.map((l) => ({
    id: l.id,
    title: l.title,
    meta: l.category?.name ?? "Uncategorized",
    status: l.publishStatus,
    updated: formatDate(l.updatedAt.toISOString().slice(0, 10)),
  }));

  return (
    <ManagementList
      index="Content"
      title="Labs"
      eyebrow="Your strongest IT proof. Published labs appear on /labs and the homepage."
      rows={rows}
      basePath="/admin/labs"
      newHref="/admin/labs/new"
      itemLabelSingular="lab"
      itemLabelPlural="labs"
      deleteOneAction={deleteLabAction}
      deleteManyAction={bulkDeleteLabsAction}
    />
  );
}
