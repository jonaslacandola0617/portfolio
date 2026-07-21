import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DifficultyBadge } from "@/components/shared/status-badges";
import type { ProjectFrontmatter } from "@/types";

export function ProjectCard({ project }: { project: ProjectFrontmatter }) {
  return (
    <Link href={`/projects/${project.slug}`} className="group block">
      <Card className="h-full overflow-hidden transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5">
        <div className="relative flex h-32 items-center justify-center border-b border-border bg-grid bg-muted/30">
          <span className="rounded-md border border-border bg-background px-2.5 py-1 font-mono text-[0.7rem] text-muted-foreground">
            {project.category}
          </span>
          <ArrowUpRight className="absolute right-3 top-3 h-4 w-4 text-muted-foreground/50 transition-all group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
        <div className="p-5">
          <div className="mb-2 flex items-center gap-2">
            <DifficultyBadge difficulty={project.difficulty} />
          </div>
          <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{project.summary}</p>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 font-mono text-[0.68rem] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {project.estimatedTime}
          </div>
        </div>
      </Card>
    </Link>
  );
}
