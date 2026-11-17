import { AboutForm } from "@/components/admin/about-form";
import { getAboutPage } from "@/lib/db/queries/about";

export default async function AdminAboutPage() {
  const about = await getAboutPage();
  return (
    <div className="admin-control-settings admin-control-about">
      <header className="admin-control-settings-head">
        <span>ABOUT PAGE</span>
        <h1>About</h1>
        <p>
          Your photo and story. The photo also appears next to “Hi, I’m …” on the homepage.{" "}
          <a href="/about" target="_blank" rel="noreferrer" className="admin-inline-link">View About page ↗</a>
        </p>
      </header>
      <AboutForm about={about} />
    </div>
  );
}
