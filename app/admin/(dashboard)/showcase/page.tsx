import { HomepageShowcaseForm } from "@/components/admin/homepage-showcase-form";
import { PageHeader, PageShell } from "@/components/shared/page-header";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { getPublishedProjectShowcaseOptions } from "@/lib/services/project-admin-service";

export default async function AdminHomepageShowcasePage() {
  const [settings, projectOptions] = await Promise.all([
    getSiteSettings(),
    getPublishedProjectShowcaseOptions(),
  ]);

  return (
    <div>
      <PageHeader
        index="07"
        eyebrow="Public presentation."
        title="Homepage"
        description="Choose the two published projects that lead the public homepage. The order here maps directly to the primary and secondary showcase spaces."
      />
      <PageShell>
        <HomepageShowcaseForm
          projectOptions={projectOptions}
          selectedIds={settings.homepageProjectIds}
        />
      </PageShell>
    </div>
  );
}
