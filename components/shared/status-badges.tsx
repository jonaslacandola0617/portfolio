import type { ContentStatus, Difficulty } from "@/types";
import { cn } from "@/lib/utils";

const difficultyDots: Record<Difficulty, number> = { beginner: 1, intermediate: 2, advanced: 3 };

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const n = difficultyDots[difficulty];
  return (
    <span className="difficulty-badge" title={difficulty} aria-label={`Difficulty: ${difficulty}`}>
      {[1, 2, 3].map((i) => <span key={i} className={cn(i <= n && "is-on")} />)}
    </span>
  );
}

const statusLabels: Record<ContentStatus, string> = { completed: "Completed", "in-progress": "In progress", planned: "Planned" };

export function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span className={cn("status-badge", `is-${status}`)}>
      <span aria-hidden="true" />
      {statusLabels[status] ?? status}
    </span>
  );
}
