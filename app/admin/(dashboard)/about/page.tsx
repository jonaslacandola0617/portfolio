import { AboutForm } from "@/components/admin/about-form";
import { getAboutPage } from "@/lib/db/queries/about";

export default async function AdminAboutPage() {
  const about = await getAboutPage();
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-10">
      <h1 className="font-display text-2xl font-semibold text-foreground">About page</h1>
      <p className="mb-6 mt-2 text-sm text-muted-foreground">
        Edit the biography, working philosophy, and current-focus content shown at /about.
      </p>
      <AboutForm about={about} />
    </div>
  );
}
