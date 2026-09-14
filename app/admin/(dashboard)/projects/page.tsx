import { ManagementList, type ManagementListRow } from "@/components/admin/management-list";
import { GitHubProjectSync } from "@/components/admin/github-project-sync";
import { PageShell } from "@/components/shared/page-header";
import { getAllProjectsForAdmin } from "@/lib/services/project-admin-service";
import {
  getGitHubProjectDashboard,
  type GitHubProjectDashboard,
} from "@/lib/services/github-project-sync-service";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { githubOwnerFromUrl } from "@/lib/github/project-sync";
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

  const githubOwner = githubOwnerFromUrl(settings.githubUrl);
  const githubData: GitHubProjectDashboard = githubOwner
    ? await getGitHubProjectDashboard(githubOwner)
    : {
        repositories: [],
        accessMode: "public",
        appConfigured: false,
        appInstalled: false,
        appInstallUrl: null,
        installationAccounts: [],
        error: "Add your GitHub profile URL in Site Settings to enable repository discovery.",
      };

  return (
    <>
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
      <PageShell className="pt-0">
        <GitHubProjectSync data={githubData} />
      </PageShell>
    </>
  );
}
