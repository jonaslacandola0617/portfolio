import { ManagementListSkeleton } from "@/components/shared/skeleton";

/**
 * Route-segment Suspense fallback for everything under
 * app/admin/(dashboard) — list pages, edit pages, new pages, media,
 * settings. Renders inside AdminDashboardLayout, so the sidebar stays
 * mounted and visible; only the `{children}` area shows the skeleton.
 * A list-shaped skeleton is a reasonable generic default across every
 * admin route (list pages are the common case; edit/new pages are a
 * single Card, close enough in silhouette not to look jarring for the
 * brief moment it's visible).
 */
export default function Loading() {
  return <ManagementListSkeleton />;
}
