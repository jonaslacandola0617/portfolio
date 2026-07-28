import Link from "next/link";
import { AlertTriangle, BadgeCheck, FlaskConical, FolderGit2, NotebookPen } from "lucide-react";
import { getDashboardOverview } from "@/lib/services/dashboard-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/admin/stat-card";
import type { ContentTypeMetric, DashboardSection } from "@/types/admin";

const metricIcons = {
  projects: FolderGit2,
  labs: FlaskConical,
  articles: NotebookPen,
  certificates: BadgeCheck,
};

function SectionFailure({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-6 text-sm text-muted-foreground">
      <AlertTriangle className="mb-2 h-5 w-5 text-warning" />
      {message} Refresh the page to try again.
    </div>
  );
}

function Metrics({ section }: { section: DashboardSection<ContentTypeMetric[]> }) {
  if (!section.ok) return <SectionFailure message={section.message} />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {section.data.map((metric) => (
        <StatCard
          key={metric.key}
          label={metric.label}
          value={metric.total}
          href={metric.href}
          icon={metricIcons[metric.key]}
        />
      ))}
    </div>
  );
}

function relativeTime(value: string) {
  const delta = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(delta / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

export default async function AdminDashboardPage() {
  const overview = await getDashboardOverview();

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 md:px-10">
      <div className="mb-7">
        <h1 className="font-display text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Portfolio content and recent CMS updates.</p>
      </div>

      <Metrics section={overview.metrics} />

      <Card className="mt-6 overflow-hidden">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="font-mono text-sm uppercase tracking-wide text-muted-foreground">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {overview.recentlyUpdated.ok ? (
            overview.recentlyUpdated.data.length ? (
              <div className="divide-y divide-border">
                {overview.recentlyUpdated.data.map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.href}
                    className="grid gap-1 px-5 py-3 transition-colors hover:bg-accent sm:grid-cols-[6rem_1fr_auto_auto] sm:items-center sm:gap-3"
                  >
                    <span className="font-mono text-[0.62rem] tracking-wide text-primary">{item.type}</span>
                    <span className="truncate text-sm font-medium text-foreground">{item.title}</span>
                    <Badge variant="outline">{item.status}</Badge>
                    <span className="text-xs text-muted-foreground">{relativeTime(item.updatedAt)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="px-5 py-8 text-sm text-muted-foreground">No content updates yet.</p>
            )
          ) : (
            <div className="p-5"><SectionFailure message={overview.recentlyUpdated.message} /></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
