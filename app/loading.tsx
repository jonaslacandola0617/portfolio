import { PageSkeleton } from "@/components/shared/skeleton";

/**
 * Route-segment Suspense fallback for the whole public site — see
 * components/shared/skeleton.tsx's comment. Renders inside SiteChrome
 * (app/layout.tsx), so the header/nav/footer stay visible and only the
 * page content area shows the skeleton during slow navigation.
 */
export default function Loading() {
  return <PageSkeleton />;
}
