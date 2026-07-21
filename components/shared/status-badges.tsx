import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CircleDashed, CircleDot } from "lucide-react";
import type { ContentStatus, Difficulty } from "@/types";

const difficultyLabel: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const difficultyDots: Record<Difficulty, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <Badge variant="outline" className="gap-1.5">
      <span className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${
              i <= difficultyDots[difficulty] ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </span>
      {difficultyLabel[difficulty]}
    </Badge>
  );
}

const statusConfig: Record<
  ContentStatus,
  { label: string; variant: "success" | "warning" | "default"; icon: typeof CheckCircle2 }
> = {
  completed: { label: "Completed", variant: "success", icon: CheckCircle2 },
  "in-progress": { label: "In Progress", variant: "warning", icon: CircleDot },
  planned: { label: "Planned", variant: "default", icon: CircleDashed },
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
