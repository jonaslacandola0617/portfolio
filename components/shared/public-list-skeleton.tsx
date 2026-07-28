import { Skeleton } from "@/components/shared/skeleton";

export function PublicListSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12" aria-label="Loading content list">
      <div className="mb-10 space-y-3"><Skeleton className="h-9 w-56" /><Skeleton className="h-4 w-[28rem] max-w-full" /></div>
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-lg border border-border bg-card p-5"><Skeleton className="mb-4 h-36 w-full" /><Skeleton className="mb-2 h-5 w-2/3" /><Skeleton className="mb-2 h-4 w-full" /><Skeleton className="h-4 w-4/5" /></div>)}
      </div>
    </div>
  );
}
