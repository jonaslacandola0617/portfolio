import Link from "next/link";
import { Plus, FolderGit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";
import { ManagementList, type ManagementListRow } from "@/components/admin/management-list";
import { getAllProjectsForAdmin } from "@/lib/services/project-admin-service";
import { formatDate } from "@/lib/utils";
import { deleteProjectAction, bulkDeleteProjectsAction } from "./actions";

const statusVariant = {
  DRAFT: "default",
  PUBLISHED: "success",
  ARCHIVED: "outline",
  SCHEDULED: "warning",
} as const;

export default async function AdminProjectsPage() {
  const projects = await getAllProjectsForAdmin();

  const rows: ManagementListRow[] = projects.map((p) => ({
    id: p.id,
    title: p.title,
    subtitle: `/${p.slug} · updated ${formatDate(p.updatedAt.toISOString().slice(0, 10))}`,
    badgeLabel: p.publishStatus,
    badgeVariant: statusVariant[p.publishStatus as keyof typeof statusVariant],
  }));

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">{projects.length} total</p>
        </div>
        <Button asChild>
          <Link href="/admin/projects/new">
            <Plus className="h-4 w-4" /> New project
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title="No projects yet"
          description="Create your first project to get started."
        />
      ) : (
        <ManagementList
          rows={rows}
          basePath="/admin/projects"
          itemLabelSingular="project"
          itemLabelPlural="projects"
          deleteOneAction={deleteProjectAction}
          deleteManyAction={bulkDeleteProjectsAction}
        />
      )}
    </div>
  );
}
