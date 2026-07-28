import { Skeleton } from "@/components/shared/skeleton";

export function PublicDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12" aria-label="Loading content detail">
      <Skeleton className="mb-8 h-4 w-28" />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div><Skeleton className="mb-3 h-10 w-4/5" /><Skeleton className="mb-8 h-4 w-2/5" /><div className="space-y-4"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-11/12" /><Skeleton className="h-40 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /></div></div>
        <aside className="space-y-3"><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-3/4" /></aside>
      </div>
      <Skeleton className="mt-12 h-44 w-full" />
    </div>
  );
}
