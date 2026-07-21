import Link from "next/link";
import { cn } from "@/lib/utils";
import type { SkillItem } from "@/types";

const levelConfig = {
  learning: { label: "Learning", dot: "bg-warning" },
  practiced: { label: "Practiced", dot: "bg-primary" },
  comfortable: { label: "Comfortable", dot: "bg-success" },
};

export function SkillBadge({ skill }: { skill: SkillItem }) {
  const config = levelConfig[skill.level];
  const hasLinks = skill.relatedProjectSlugs && skill.relatedProjectSlugs.length > 0;

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3.5 py-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", config.dot)} />
        <span className="truncate text-sm text-foreground">{skill.name}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="font-mono text-[0.65rem] text-muted-foreground">{config.label}</span>
        {hasLinks && (
          <Link
            href={`/projects/${skill.relatedProjectSlugs![0]}`}
            className="rounded border border-border px-1.5 py-0.5 font-mono text-[0.6rem] text-primary hover:border-primary/40"
          >
            in project
          </Link>
        )}
      </div>
    </div>
  );
}
