import { Github, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateShort } from "@/lib/utils";
import type { GitHubActivity } from "@/types";

export function GitHubCard({ activity }: { activity: GitHubActivity[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-mono uppercase tracking-wide text-muted-foreground">
          GitHub Activity
        </CardTitle>
        <Github className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        {activity.map((repo) => (
          <a
            key={repo.repo}
            href={repo.url}
            target="_blank"
            rel="noreferrer"
            className="group block rounded-md border border-border p-3 transition-colors hover:border-primary/40"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-sm text-foreground group-hover:text-primary transition-colors">
                {repo.repo}
              </span>
              <Star className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
            </div>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{repo.description}</p>
            <div className="mt-2 flex items-center gap-3 font-mono text-[0.65rem] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-primary" />
                {repo.language}
              </span>
              <span>Updated {formatDateShort(repo.updatedAt)}</span>
            </div>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
