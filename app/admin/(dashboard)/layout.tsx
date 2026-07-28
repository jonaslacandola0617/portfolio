import { requireAdmin } from "@/lib/services/auth-service";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { NavigationProgress } from "@/components/admin/navigation-progress";

/**
 * Added during the pre-Phase-6 stabilization pass after a real `npm run
 * build` failure surfaced it: every route under /admin/* needs a live
 * session (requireAdmin()) and live, per-request database reads (admin
 * list/edit pages intentionally do NOT fail open on a DB error the way
 * the public queries do — see lib/services/*-admin-service.ts, showing
 * an admin a false-empty list on a real DB outage would be worse than
 * an error). Without this, Next.js still attempts to statically
 * prerender these routes at build time; `requireAdmin()`'s use of
 * `cookies()` inside a Server Component should normally opt a route out
 * of static generation automatically, but the page's own admin-service
 * data fetch runs before that's resolved for this route shape, so a
 * build-time DB error crashed the whole build rather than being
 * deferred to request time as it should be. `force-dynamic` makes this
 * segment's dynamic-only nature explicit and unambiguous.
 */
export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense-in-depth: middleware.ts already blocked non-admins from
  // reaching here. This is the second, redundant check — see
  // lib/services/auth-service.ts for why it's worth the duplication.
  await requireAdmin();

  return (
    <div>
      <AdminSidebar />
      <main className="lg:pl-[272px]"><NavigationProgress>{children}</NavigationProgress></main>
    </div>
  );
}
