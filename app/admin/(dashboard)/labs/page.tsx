import Link from "next/link";
import { Plus, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";
import { ManagementList, type ManagementListRow } from "@/components/admin/management-list";
import { getAllLabsForAdmin } from "@/lib/services/lab-admin-service";
import { formatDate } from "@/lib/utils";
import { deleteLabAction, bulkDeleteLabsAction } from "./actions";

const statusVariant = { DRAFT: "default", PUBLISHED: "success", ARCHIVED: "outline", SCHEDULED: "warning" } as const;

export default async function AdminLabsPage() {
  const labs = await getAllLabsForAdmin();

  const rows: ManagementListRow[] = labs.map((l) => ({
    id: l.id,
    title: l.title,
    subtitle: `/${l.slug} · updated ${formatDate(l.updatedAt.toISOString().slice(0, 10))}`,
    badgeLabel: l.publishStatus,
    badgeVariant: statusVariant[l.publishStatus as keyof typeof statusVariant],
  }));

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Labs</h1>
          <p className="mt-1 text-sm text-muted-foreground">{labs.length} total</p>
        </div>
        <Button asChild>
          <Link href="/admin/labs/new"><Plus className="h-4 w-4" /> New lab</Link>
        </Button>
      </div>

      {labs.length === 0 ? (
        <EmptyState icon={FlaskConical} title="No labs yet" description="Log your first lab to get started." />
      ) : (
        <ManagementList
          rows={rows}
          basePath="/admin/labs"
          itemLabelSingular="lab"
          itemLabelPlural="labs"
          deleteOneAction={deleteLabAction}
          deleteManyAction={bulkDeleteLabsAction}
        />
      )}
    </div>
  );
}
