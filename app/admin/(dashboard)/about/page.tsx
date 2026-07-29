import { AboutForm } from "@/components/admin/about-form";
import { getAboutPage } from "@/lib/db/queries/about";

export default async function AdminAboutPage() {
  const about = await getAboutPage();
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-10">
      <h1 className="font-display text-2xl font-semibold text-foreground">About page</h1>
      <p className="mb-6 mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        Edit the biography, working philosophy, and current focus displayed on
        the public About page.
      </p>
      <AboutForm about={about} />
    </div>
  );
}
