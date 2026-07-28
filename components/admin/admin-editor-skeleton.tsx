import { Skeleton } from "@/components/shared/skeleton";

export function AdminEditorSkeleton({ richText = true }: { richText?: boolean }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 md:px-10" aria-label="Loading editor">
      <Skeleton className="mb-6 h-4 w-32" />
      <Skeleton className="mb-6 h-8 w-64" />
      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-5">
          <Skeleton className="mb-5 h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-3 w-12" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2 sm:col-span-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-20 w-full" /></div>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        </div>
        {richText && (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex gap-2 border-b border-border p-3">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-7 w-7" />)}</div>
            <div className="space-y-3 p-5"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-11/12" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-28 w-full" /></div>
          </div>
        )}
        <div className="flex justify-end gap-3"><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-32" /></div>
      </div>
    </div>
  );
}
