import { Skeleton } from "@/components/shared/skeleton";

export function MediaLibrarySkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6 md:px-10" aria-label="Loading media library">
      <div className="mb-6 space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-20" /></div>
      <Skeleton className="h-28 w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="overflow-hidden rounded-lg border border-border"><Skeleton className="h-32 rounded-none" /><div className="space-y-2 p-3"><Skeleton className="h-4 w-4/5" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-7 w-28" /></div></div>)}
      </div>
    </div>
  );
}
