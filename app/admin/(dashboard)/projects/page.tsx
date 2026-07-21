import Link from "next/link";
import { Plus, FolderGit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/admin/empty-state";
import { getAllProjectsForAdmin } from "@/lib/services/project-admin-service";
import { formatDate } from "@/lib/utils";

const statusVariant = {
  DRAFT: "default",
  PUBLISHED: "success",
  ARCHIVED: "outline",
  SCHEDULED: "warning",
} as const;

export default async function AdminProjectsPage() {
  const projects = await getAllProjectsForAdmin();

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
        <div className="divide-y divide-border rounded-lg border border-border">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/admin/projects/${p.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-accent"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{p.title}</div>
                <div className="mt-0.5 font-mono text-[0.68rem] text-muted-foreground">
                  /{p.slug} · updated {formatDate(p.updatedAt.toISOString().slice(0, 10))}
                </div>
              </div>
              <Badge variant={statusVariant[p.publishStatus as keyof typeof statusVariant]}>
                {p.publishStatus}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
