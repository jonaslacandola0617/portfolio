import { SettingsForm } from "@/components/admin/settings-form";
import { getSiteSettings } from "@/lib/db/queries/settings";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="admin-control-settings">
      <header className="admin-control-settings-head">
        <span>07 / SYSTEM</span>
        <h1>Settings</h1>
        <p>Site identity, public links, resume path, and current learning items.</p>
      </header>
      <SettingsForm settings={settings} />
    </div>
  );
}
