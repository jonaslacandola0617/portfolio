import Link from "next/link";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HomepageActivity } from "@/lib/db/queries/homepage";

function relativeTime(value: string): string {
  const elapsed = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(elapsed / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

export function RecentActivityCard({ activity }: { activity: HomepageActivity[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="font-mono text-sm uppercase tracking-wide text-muted-foreground">
          Recent Activity
        </CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        {activity.length === 0 ? (
          <p className="rounded-md border border-border p-3 text-sm text-muted-foreground">
            No published portfolio activity yet.
          </p>
        ) : (
          activity.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              href={item.href}
              className="group block rounded-md border border-border p-3 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                  {item.title}
                </span>
                <span className="shrink-0 font-mono text-[0.65rem] text-muted-foreground">
                  {relativeTime(item.updatedAt)}
                </span>
              </div>
              <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                {item.type}
              </p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
