import { ManagementList, type ManagementListRow } from "@/components/admin/management-list";
import { getAllProjectsForAdmin } from "@/lib/services/project-admin-service";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { formatDate } from "@/lib/utils";
import { deleteProjectAction, bulkDeleteProjectsAction, toggleHomepageProjectAction } from "@/app/admin/(dashboard)/projects/actions";

export default async function AdminProjectsPage() {
  const [items, settings] = await Promise.all([
    getAllProjectsForAdmin(),
    getSiteSettings(),
  ]);
  const rows: ManagementListRow[] = items.map((p) => ({
    id: p.id,
    title: p.title,
    meta: p.category?.name ?? "Uncategorized",
    status: p.publishStatus,
    updated: formatDate(p.updatedAt.toISOString().slice(0, 10)),
  }));

  return (
    <ManagementList
      index="01"
      title="Projects"
      eyebrow="Build projects."
      rows={rows}
      basePath="/admin/projects"
      newHref="/admin/projects/new"
      itemLabelSingular="project"
      itemLabelPlural="projects"
      deleteOneAction={deleteProjectAction}
      deleteManyAction={bulkDeleteProjectsAction}
      showcase={{
        selectedIds: settings.homepageProjectIds,
        max: 2,
        toggleAction: toggleHomepageProjectAction,
      }}
    />
  );
}
