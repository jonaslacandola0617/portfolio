import { SettingsForm } from "@/components/admin/settings-form";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { getAllProjectsForAdmin } from "@/lib/services/project-admin-service";

export default async function AdminSettingsPage() {
  const [settings, projects] = await Promise.all([
    getSiteSettings(),
    getAllProjectsForAdmin(),
  ]);

  const projectOptions = projects
    .filter((project) => project.publishStatus === "PUBLISHED")
    .map((project) => ({ id: project.id, title: project.title }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="admin-control-settings">
      <header className="admin-control-settings-head">
        <span>07 / SETTINGS</span>
        <h1>Settings</h1>
        <p>Site identity, public links, current learning items, and the projects shown on the homepage.</p>
      </header>
      <SettingsForm settings={settings} projectOptions={projectOptions} />
    </div>
  );
}
