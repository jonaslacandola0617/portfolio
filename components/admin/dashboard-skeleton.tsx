import { Skeleton } from "@/components/shared/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 md:px-10" aria-label="Loading dashboard">
      <div className="mb-7 space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-96 max-w-full" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>
    </div>
  );
}
