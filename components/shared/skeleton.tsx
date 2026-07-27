import { cn } from "@/lib/utils";

/**
 * Added during the pre-Phase-6 stabilization pass (Workstream C1) — the
 * project had no `loading.tsx` files at all, so any navigation slower
 * than an instant (a cold Neon connection, a slow public page's
 * queries) just held the previous page on screen with no feedback,
 * which is indistinguishable from a frozen tab.
 *
 * Plain skeleton blocks — deliberately not trying to precisely mirror
 * every page's real layout, just communicating "content is loading
 * here" while `app/loading.tsx` / `app/admin/(dashboard)/loading.tsx`
 * (Next.js route-segment Suspense boundaries) are in effect.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">
      <Skeleton className="mb-3 h-8 w-64" />
      <Skeleton className="mb-8 h-4 w-96 max-w-full" />
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

export function ManagementListSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Skeleton className="mb-2 h-7 w-40" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="divide-y divide-border rounded-lg border border-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-4 w-4 flex-shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-5 w-16 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
