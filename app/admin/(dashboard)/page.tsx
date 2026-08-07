import Link from "next/link";
import { AlertTriangle, BadgeCheck, FlaskConical, FolderGit2, NotebookPen } from "lucide-react";
import { getDashboardOverview } from "@/lib/services/dashboard-service";
import { StatCard } from "@/components/admin/stat-card";
import { PageHeader, PageShell } from "@/components/shared/page-header";
import type { ContentTypeMetric, DashboardSection } from "@/types/admin";

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
    <div>
      <PageHeader index="00" eyebrow="Overview of published content." title="Dashboard" />
      <PageShell>
        <div className="mb-10">
          <Metrics section={overview.metrics} />
        </div>

        <div>
          <p className="idx mb-3">Recent Activity</p>
          {overview.recentlyUpdated.ok ? (
            overview.recentlyUpdated.data.length ? (
              <div className="border border-border bg-surface-2">
                {overview.recentlyUpdated.data.map((item, index) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.href}
                    className={`grid gap-1 px-4 py-3 transition-colors hover:bg-surface-3 sm:grid-cols-[88px_1fr_110px_90px] sm:items-center sm:gap-3 ${index ? "border-t border-border" : ""}`}
                  >
                    <span className="label text-cobalt">{item.type}</span>
                    <span className="truncate text-sm font-medium text-text">{item.title}</span>
                    <span className="label flex items-center gap-1.5 text-text-dim">
                      <span className={`h-1.5 w-1.5 rounded-full ${item.status === "PUBLISHED" ? "bg-teal" : "bg-signal"}`} />
                      {item.status}
                    </span>
                    <span className="font-mono text-xs text-muted sm:text-right">{relativeTime(item.updatedAt)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="border border-border px-4 py-8 text-sm text-muted">No content updates yet.</p>
            )
          ) : (
            <SectionFailure message={overview.recentlyUpdated.message} />
          )}
        </div>
      </PageShell>
    </div>
  );
}
