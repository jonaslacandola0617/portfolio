import { SettingsForm } from "@/components/admin/settings-form";
import { getSiteSettings } from "@/lib/db/queries/settings";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  return (
    <div className="px-6 py-8 sm:px-10">
      <h1 className="font-display text-2xl font-semibold text-text">Settings</h1>
      <p className="mb-8 mt-1 text-sm text-text-dim">Site identity, public links, resume path, and current learning items.</p>
      <SettingsForm settings={settings} />
    </div>
  );
}
