import { ManagementList, type ManagementListRow } from "@/components/admin/management-list";
import { getAllProjectsForAdmin } from "@/lib/services/project-admin-service";
import { formatDate } from "@/lib/utils";
import {
  deleteProjectAction,
  bulkDeleteProjectsAction,
  toggleProjectShowcaseAction,
} from "@/app/admin/(dashboard)/projects/actions";

export default async function AdminProjectsPage() {
  const items = await getAllProjectsForAdmin();
  const rows: ManagementListRow[] = items.map((p) => ({
    id: p.id,
    title: p.title,
    meta: p.category?.name ?? "Uncategorized",
    status: p.publishStatus,
    updated: formatDate(p.updatedAt.toISOString().slice(0, 10)),
    showcaseOrder: p.showcaseOrder,
  }));

  return (
    <ManagementList
      index="01"
      title="Projects"
      eyebrow="Build projects. Toggle up to two published projects for the homepage showcase."
      rows={rows}
      basePath="/admin/projects"
      newHref="/admin/projects/new"
      itemLabelSingular="project"
      itemLabelPlural="projects"
      deleteOneAction={deleteProjectAction}
      deleteManyAction={bulkDeleteProjectsAction}
      showcaseAction={toggleProjectShowcaseAction}
    />
  );
}
