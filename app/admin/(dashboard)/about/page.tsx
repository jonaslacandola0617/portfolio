import { AboutForm } from "@/components/admin/about-form";
import { PageHeader, PageShell } from "@/components/shared/page-header";
import { getAboutPage } from "@/lib/db/queries/about";

export default async function AdminAboutPage() {
  const about = await getAboutPage();
  return (
    <div>
      <PageHeader
        index="06"
        eyebrow="Public identity."
        title="About"
        description="Manage the personal narrative, profile image, current focus, learning philosophy, and what comes next."
      />
      <PageShell>
        <AboutForm about={about} />
      </PageShell>
    </div>
  );
}
