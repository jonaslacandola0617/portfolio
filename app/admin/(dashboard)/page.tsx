import Link from "next/link";
import { AlertTriangle, BadgeCheck, FlaskConical, FolderGit2, NotebookPen, GitCommitHorizontal } from "lucide-react";
import { getDashboardOverview } from "@/lib/services/dashboard-service";
import { StatCard } from "@/components/admin/stat-card";
import { PageHeader, PageShell } from "@/components/shared/page-header";
import type { ContentTypeMetric, DashboardSection, RecentlyUpdatedItem } from "@/types/admin";

const metricIcons = {
  projects: FolderGit2,
  labs: FlaskConical,
  articles: NotebookPen,
  certificates: BadgeCheck,
};

function SectionFailure({ message }: { message: string }) {
  return (
    <div className="border border-signal/40 bg-surface-2 px-4 py-6 text-sm text-text-dim">
      <AlertTriangle className="mb-2 h-5 w-5 text-signal" />
      {message} Refresh the page to try again.
    </div>
  );
}

function Metrics({ section }: { section: DashboardSection<ContentTypeMetric[]> }) {
  if (!section.ok) return <SectionFailure message={section.message} />;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {section.data.map((metric) => (
        <StatCard key={metric.key} label={metric.label} value={metric.total} href={metric.href} icon={metricIcons[metric.key]} />
      ))}
    </div>
  );
}

function dashboardDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const activityIcons = {
  PROJECT: FolderGit2,
  LAB: FlaskConical,
  ARTICLE: NotebookPen,
  CERTIFICATE: BadgeCheck,
} as const;

function RecentActivity({ section }: { section: DashboardSection<RecentlyUpdatedItem[]> }) {
  if (!section.ok) return <SectionFailure message={section.message} />;

  const recentItems = section.data.slice(0, 4);

  if (!recentItems.length) {
    return <p className="border border-border px-4 py-8 text-sm text-muted">No content updates yet.</p>;
  }

  return (
    <div className="border border-border bg-surface-2">
      {recentItems.map((item, index) => {
        const Icon = activityIcons[item.type] ?? GitCommitHorizontal;
        return (
          <Link
            key={`${item.type}-${item.id}`}
            href={item.href}
            className={`flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-3 ${index !== recentItems.length - 1 ? "border-b border-border" : ""}`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-cobalt" />
            <span className="min-w-0 flex-1 truncate text-sm text-text">{item.title}</span>
            <span className="shrink-0 font-mono text-xs text-muted">{dashboardDate(item.updatedAt)}</span>
          </Link>
        );
      })}
    </div>
  );
}


export default async function AdminDashboardPage() {
  const overview = await getDashboardOverview();

  return (
    <div>
      <PageHeader index="00" eyebrow="Overview of published content." title="Dashboard" />
      <PageShell>
        <div className="mb-10">
          <Metrics section={overview.metrics} />
        </div>

        <div>
          <p className="idx mb-3">Recent Activity</p>
          <RecentActivity section={overview.recentlyUpdated} />
        </div>
      </PageShell>
    </div>
  );
}
