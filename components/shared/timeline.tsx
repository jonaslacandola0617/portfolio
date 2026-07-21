import { Network, ShieldCheck, Terminal, Code2, Flag } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { TimelineEntry } from "@/types";

const categoryConfig: Record<
  TimelineEntry["category"],
  { icon: typeof Network; color: string; ring: string }
> = {
  networking: { icon: Network, color: "text-primary", ring: "ring-primary/30" },
  security: { icon: ShieldCheck, color: "text-success", ring: "ring-success/30" },
  linux: { icon: Terminal, color: "text-warning", ring: "ring-warning/30" },
  programming: { icon: Code2, color: "text-primary", ring: "ring-primary/30" },
  milestone: { icon: Flag, color: "text-destructive", ring: "ring-destructive/30" },
};

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="relative border-l border-border ml-4">
      {entries.map((entry) => {
        const config = categoryConfig[entry.category];
        const EntryIcon = config.icon;
        return (
          <li key={entry.id} className="relative pb-10 pl-8 last:pb-0">
            <span
              className={`absolute -left-[9px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-card ring-4 ${config.ring}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full bg-current ${config.color}`} />
            </span>
            <div className="flex items-center gap-2">
              <EntryIcon className={`h-3.5 w-3.5 ${config.color}`} />
              <time className="font-mono text-xs text-muted-foreground">{formatDate(entry.date)}</time>
            </div>
            <h3 className="mt-1.5 font-display text-sm font-semibold text-foreground">{entry.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>
            {entry.tags && entry.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
