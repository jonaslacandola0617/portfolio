import { Skeleton } from "@/components/shared/skeleton";

export function AdminListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6 md:px-10" aria-label="Loading management list">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="space-y-2"><Skeleton className="h-7 w-40" /><Skeleton className="h-4 w-64 max-w-full" /></div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="mb-3 h-9 w-full" />
      <div className="divide-y divide-border rounded-lg border border-border">
        <div className="flex gap-3 bg-muted/20 px-4 py-2"><Skeleton className="h-4 w-4" /><Skeleton className="h-3 w-20" /></div>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-4 w-2/5" /><Skeleton className="h-3 w-1/3" /></div>
            <Skeleton className="h-5 w-16" /><Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
