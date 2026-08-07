import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-border px-6 py-10 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center border border-border bg-surface-3">
        <Icon className="h-[18px] w-[18px] text-text-dim" />
      </div>
      <p className="text-sm font-medium text-text">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-text-dim">{description}</p>
    </div>
  );
}
