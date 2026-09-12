import { AboutForm } from "@/components/admin/about-form";
import { getAboutPage } from "@/lib/db/queries/about";

export default async function AdminAboutPage() {
  const about = await getAboutPage();
  return (
    <div className="admin-control-settings admin-control-about">
      <header className="admin-control-settings-head">
        <span>06 / ABOUT</span>
        <h1>About</h1>
        <p>Profile image, background, focus, and public About-page narrative.</p>
      </header>
      <AboutForm about={about} />
    </div>
  );
}
