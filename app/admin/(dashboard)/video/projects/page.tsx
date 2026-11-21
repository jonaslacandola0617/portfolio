import { ManagementList, type ManagementListRow } from "@/components/admin/management-list";
import { getAllVideoProjectsForAdmin, getVideoHomepageSettingsForAdmin } from "@/lib/services/video-admin-service";
import { formatDate } from "@/lib/utils";
import {
  bulkDeleteVideoProjectsAction,
  deleteVideoProjectAction,
  reorderVideoProjectsAction,
  toggleFeaturedVideoAction,
} from "@/app/admin/(dashboard)/video/actions";

function disciplines(values: string[]) {
  if (!values.length) return "Unassigned";
  return values.map((value) => value === "VIDEO_EDITING" ? "Video Editing" : "Cinematography").join(" · ");
}

export default async function AdminVideoProjectsPage() {
  const [items, homepage] = await Promise.all([getAllVideoProjectsForAdmin(), getVideoHomepageSettingsForAdmin()]);
  const rows: ManagementListRow[] = items.map((item) => ({
    id: item.id,
    title: item.title,
    meta: `${disciplines(item.disciplines)}${item.completionDate ? ` · ${item.completionDate.getFullYear()}` : ""}`,
    status: item.publishStatus,
    updated: formatDate(item.updatedAt.toISOString().slice(0, 10)),
  }));

  return (
    <ManagementList
      index="Video & design"
      title="Videos"
      eyebrow="Videos shown on /video. Star up to three to feature them on the video page."
      rows={rows}
      basePath="/admin/video/projects"
      newHref="/admin/video/projects/new"
      itemLabelSingular="video project"
      itemLabelPlural="video projects"
      deleteOneAction={deleteVideoProjectAction}
      deleteManyAction={bulkDeleteVideoProjectsAction}
      reorderAction={reorderVideoProjectsAction}
      showcase={{ selectedIds: homepage.settings.featuredVideoIds, max: 3, toggleAction: toggleFeaturedVideoAction }}
    />
  );
}
