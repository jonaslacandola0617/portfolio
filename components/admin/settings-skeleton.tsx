import { Skeleton } from "@/components/shared/skeleton";

export function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-6 md:px-10" aria-label="Loading settings">
      <Skeleton className="mb-2 h-8 w-36" /><Skeleton className="mb-6 h-4 w-full" />
      {["Site identity", "Contact information", "Social links", "Currently learning"].map((label) => (
        <div key={label} className="mb-5 rounded-lg border border-border bg-card p-5">
          <span className="sr-only">{label}</span><Skeleton className="mb-4 h-5 w-36" />
          <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10 sm:col-span-2" /></div>
        </div>
      ))}
    </div>
  );
}
