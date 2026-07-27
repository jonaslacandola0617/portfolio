import Link from "next/link";
import { Plus, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";
import { ManagementList, type ManagementListRow } from "@/components/admin/management-list";
import { getAllArticlesForAdmin } from "@/lib/services/article-admin-service";
import { formatDate } from "@/lib/utils";
import { deleteArticleAction, bulkDeleteArticlesAction } from "./actions";

const statusVariant = { DRAFT: "default", PUBLISHED: "success", ARCHIVED: "outline", SCHEDULED: "warning" } as const;

export default async function AdminJournalPage() {
  const articles = await getAllArticlesForAdmin();

  const rows: ManagementListRow[] = articles.map((a) => ({
    id: a.id,
    title: a.title,
    subtitle: `/${a.slug} · updated ${formatDate(a.updatedAt.toISOString().slice(0, 10))}`,
    badgeLabel: a.publishStatus,
    badgeVariant: statusVariant[a.publishStatus as keyof typeof statusVariant],
  }));

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Journal</h1>
          <p className="mt-1 text-sm text-muted-foreground">{articles.length} total</p>
        </div>
        <Button asChild>
          <Link href="/admin/journal/new"><Plus className="h-4 w-4" /> New entry</Link>
        </Button>
      </div>

      {articles.length === 0 ? (
        <EmptyState icon={NotebookPen} title="No journal entries yet" description="Write your first entry to get started." />
      ) : (
        <ManagementList
          rows={rows}
          basePath="/admin/journal"
          itemLabelSingular="entry"
          itemLabelPlural="entries"
          deleteOneAction={deleteArticleAction}
          deleteManyAction={bulkDeleteArticlesAction}
        />
      )}
    </div>
  );
}
