import { SettingsForm } from "@/components/admin/settings-form";
import { getSiteSettings } from "@/lib/db/queries/settings";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 md:px-10">
      <h1 className="mb-2 font-display text-2xl font-semibold text-foreground">Settings</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Edits here go live across the public site immediately — no redeploy needed.
      </p>
      <SettingsForm settings={settings} />
    </div>
  );
}
