import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Defense-in-depth: middleware.ts already blocks unauthenticated requests
 * to /admin/*, but a Server Component shouldn't trust that as its only
 * guard — middleware config can be misconfigured or bypassed by a bug,
 * and a page rendered directly (e.g. during static analysis, or if the
 * matcher pattern is ever narrowed by mistake) should still refuse to
 * render admin data for a non-admin session.
 *
 * Called at the top of app/admin/(dashboard)/layout.tsx.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect("/admin/login");
  }
  return session;
}
