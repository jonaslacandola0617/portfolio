import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getDashboardOverview } from "@/lib/services/dashboard-service";
import { PageHeader, PageShell } from "@/components/shared/page-header";
import type { ContentTypeMetric, DashboardSection, RecentlyUpdatedItem } from "@/types/admin";

function SectionFailure({ message }: { message: string }) {
  return (
    <div className="border border-signal/40 px-4 py-6 text-sm text-text-dim">
      <AlertTriangle className="mb-2 h-5 w-5 text-signal" />
      {message} Refresh the page to try again.
    </div>
  );
}

function Metrics({ section }: { section: DashboardSection<ContentTypeMetric[]> }) {
  if (!section.ok) return <SectionFailure message={section.message} />;

  return (
    <div className="admin-control-dashboard-metrics">
      {section.data.map((metric) => (
        <Link className="admin-control-dashboard-metric" key={metric.key} href={metric.href}>
          <strong>{String(metric.total).padStart(2, "0")}</strong>
          <span>{metric.label}</span>
        </Link>
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

function RecentActivity({ section }: { section: DashboardSection<RecentlyUpdatedItem[]> }) {
  if (!section.ok) return <SectionFailure message={section.message} />;

  const recentItems = section.data.slice(0, 6);
  if (!recentItems.length) {
    return <p className="border-y border-border px-1 py-8 text-sm text-muted">No content updates yet.</p>;
  }

  return (
    <div className="admin-control-activity">
      {recentItems.map((item, index) => (
        <Link key={`${item.type}-${item.id}`} href={item.href} className="admin-control-activity-row">
          <span className="admin-control-activity-index">{String(index + 1).padStart(2, "0")}</span>
          <span className="admin-control-activity-copy">
            <strong>{item.title}</strong>
            <span>{item.type}</span>
          </span>
          <time dateTime={item.updatedAt}>{dashboardDate(item.updatedAt)}</time>
        </Link>
      ))}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const overview = await getDashboardOverview();

  return (
    <div>
      <PageHeader index="00" eyebrow="Portfolio administration / live content state" title="Dashboard" />
      <PageShell>
        <Metrics section={overview.metrics} />

        <div className="admin-control-dashboard-section-head">
          <h2>Recent activity</h2>
          <span>LAST 6 UPDATES</span>
        </div>
        <RecentActivity section={overview.recentlyUpdated} />
      </PageShell>
    </div>
  );
}
