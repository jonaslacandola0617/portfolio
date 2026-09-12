import { SettingsForm } from "@/components/admin/settings-form";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { getAllMedia } from "@/lib/services/media-admin-service";

export default async function AdminSettingsPage() {
  const [settings, media] = await Promise.all([getSiteSettings(), getAllMedia()]);
  const resumeMedia = media.filter((item) => item.type === "PDF");

  return (
    <div className="admin-control-settings">
      <header className="admin-control-settings-head">
        <span>07 / SETTINGS</span>
        <h1>Settings</h1>
        <p>Site identity, public links, and current learning items.</p>
      </header>
      <SettingsForm settings={settings} resumeMedia={resumeMedia} />
    </div>
  );
}
