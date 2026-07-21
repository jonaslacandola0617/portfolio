import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

export function PlaceholderPage({
  icon: Icon,
  title,
  description,
  phase,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 md:px-10">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted/40">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h1 className="mt-5 font-display text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <div className="mt-6 flex items-center gap-2 rounded-md border border-dashed border-border bg-muted/30 px-4 py-3 font-mono text-xs text-muted-foreground">
        <Construction className="h-3.5 w-3.5" />
        Management screens for this section land in {phase}
      </div>
    </div>
  );
}
