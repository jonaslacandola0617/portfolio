import { ManagementList, type ManagementListRow } from "@/components/admin/management-list";
import { getAllArticlesForAdmin } from "@/lib/services/article-admin-service";
import { formatDate } from "@/lib/utils";
import { deleteArticleAction, bulkDeleteArticlesAction } from "@/app/admin/(dashboard)/journal/actions";

export default async function AdminJournalPage() {
  const items = await getAllArticlesForAdmin();
  const rows: ManagementListRow[] = items.map((a) => ({
    id: a.id,
    title: a.title,
    meta: a.category?.name ?? "Uncategorized",
    status: a.publishStatus,
    updated: formatDate(a.updatedAt.toISOString().slice(0, 10)),
  }));

  return (
    <ManagementList
      index="03"
      title="Journal"
      eyebrow="Publish journals and document your journey."
      rows={rows}
      basePath="/admin/journal"
      newHref="/admin/journal/new"
      itemLabelSingular="entry"
      itemLabelPlural="entries"
      deleteOneAction={deleteArticleAction}
      deleteManyAction={bulkDeleteArticlesAction}
    />
  );
}
