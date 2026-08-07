import type { ContentStatus, Difficulty } from "@/types";

const difficultyDots: Record<Difficulty, number> = { beginner: 1, intermediate: 2, advanced: 3 };
export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const n = difficultyDots[difficulty];
  return <span className="flex items-center gap-1" title={difficulty} aria-label={`Difficulty: ${difficulty}`}>{[1,2,3].map(i=><span key={i} className={`h-2.5 w-1 ${i<=n?"bg-vermilion":"bg-border"}`} />)}</span>;
}
export function StatusBadge({ status }: { status: ContentStatus }) {
  const config = status === "completed" ? { label:"Completed", cls:"bg-teal" } : status === "in-progress" ? { label:"In Progress", cls:"bg-signal" } : { label:"Planned", cls:"bg-muted-foreground" };
  return <span className="label flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${config.cls}`} aria-hidden="true" />{config.label}</span>;
}
