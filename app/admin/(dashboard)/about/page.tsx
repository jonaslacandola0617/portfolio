import { AboutForm } from "@/components/admin/about-form";
import { getAboutPage } from "@/lib/db/queries/about";

export default async function AdminAboutPage() {
  const about = await getAboutPage();
  return (
    <div className="px-6 py-8 sm:px-10">
      <h1 className="font-display text-2xl font-semibold text-text">About</h1>
      <p className="mb-8 mt-1 text-sm text-text-dim">Edit the biography, working philosophy, and current focus shown on the public About page.</p>
      <AboutForm about={about} />
    </div>
  );
}
