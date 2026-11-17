import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CheckCircle2, CircleAlert, ExternalLink, Lightbulb, Plus } from "lucide-react";
import { getDashboardOverview } from "@/lib/services/dashboard-service";
import { getContentHealth, type HealthCheck } from "@/lib/services/content-health-service";
import { cn } from "@/lib/utils";
import type { ContentTypeMetric, DashboardSection, RecentlyUpdatedItem } from "@/types/admin";

const quickActions = [
  { label: "Edit homepage", href: "/admin/homepage" },
  { label: "New lab", href: "/admin/labs/new", create: true },
  { label: "New project", href: "/admin/projects/new", create: true },
  { label: "New certificate", href: "/admin/certificates/new", create: true },
  { label: "New journal entry", href: "/admin/journal/new", create: true },
  { label: "Upload media", href: "/admin/media" },
];

const typeLabel: Record<RecentlyUpdatedItem["type"], string> = {
  PROJECT: "Project",
  LAB: "Lab",
  ARTICLE: "Writing",
  CERTIFICATE: "Certificate",
};

function SectionFailure({ message }: { message: string }) {
  return (
    <div className="dash-failure">
      <AlertTriangle aria-hidden="true" />
      {message} Refresh the page to try again.
    </div>
  );
}

function Metrics({ section }: { section: DashboardSection<ContentTypeMetric[]> }) {
  if (!section.ok) return <SectionFailure message={section.message} />;
  return (
    <div className="dash-metrics">
      {section.data.map((metric) => (
        <Link className="dash-metric" key={metric.key} href={metric.href}>
          <span className="dash-metric-label">{metric.label}</span>
          <strong>{metric.published}</strong>
          <span className="dash-metric-sub">
            published{metric.total > metric.published ? ` · ${metric.total - metric.published} not live` : ""}
          </span>
        </Link>
      ))}
    </div>
  );
}

function HealthIcon({ level }: { level: HealthCheck["level"] }) {
  if (level === "fix") return <CircleAlert className="dash-health-icon is-fix" aria-label="Needs fixing" />;
  if (level === "tip") return <Lightbulb className="dash-health-icon is-tip" aria-label="Suggestion" />;
  return <CheckCircle2 className="dash-health-icon is-ok" aria-label="Looks good" />;
}

function Health({ checks }: { checks: HealthCheck[] | null }) {
  if (!checks) return <SectionFailure message="The checklist could not be loaded." />;
  const toFix = checks.filter((check) => check.level === "fix").length;
  return (
    <section className="dash-panel" aria-labelledby="health-title">
      <div className="dash-panel-head">
        <h2 id="health-title">How your portfolio looks to employers</h2>
        <span className={cn("dash-pill", toFix ? "is-fix" : "is-ok")}>{toFix ? `${toFix} to fix` : "All good"}</span>
      </div>
      <ul className="dash-health">
        {checks.map((check) => (
          <li key={check.id} className={cn("dash-health-row", `is-${check.level}`)}>
            <HealthIcon level={check.level} />
            <div className="dash-health-copy">
              <strong>{check.title}</strong>
              <p>{check.detail}</p>
              {check.items?.length ? (
                <ul className="dash-health-items">
                  {check.items.map((item) => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}
                </ul>
              ) : null}
            </div>
            <Link href={check.href} className={cn("dash-btn", check.level === "ok" ? "is-quiet" : "is-solid")}>{check.action}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function dashboardDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function RecentActivity({ section }: { section: DashboardSection<RecentlyUpdatedItem[]> }) {
  if (!section.ok) return <SectionFailure message={section.message} />;
  const recentItems = section.data.slice(0, 6);
  return (
    <section className="dash-panel" aria-labelledby="recent-title">
      <div className="dash-panel-head">
        <h2 id="recent-title">Recently edited</h2>
      </div>
      {recentItems.length ? (
        <ul className="dash-recent">
          {recentItems.map((item) => (
            <li key={`${item.type}-${item.id}`}>
              <Link href={item.href}>
                <span className="dash-recent-type">{typeLabel[item.type] ?? item.type}</span>
                <strong>{item.title}</strong>
                <span className={cn("dash-status", `is-${item.status.toLowerCase()}`)}>{item.status.toLowerCase()}</span>
                <time dateTime={item.updatedAt}>{dashboardDate(item.updatedAt)}</time>
              </Link>
            </li>
          ))}
        </ul>
      ) : <p className="dash-empty">No content yet. Start with a lab.</p>}
    </section>
  );
}

export default async function AdminDashboardPage() {
  const [overview, health] = await Promise.all([
    getDashboardOverview(),
    getContentHealth().catch(() => null),
  ]);

  return (
    <div className="dash">
      <header className="dash-head">
        <div>
          <p className="dash-kicker">Dashboard</p>
          <h1>Welcome back.</h1>
          <p>Fix what&apos;s flagged, keep adding labs, and check the live site after big changes.</p>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="dash-btn is-solid"><ExternalLink aria-hidden="true" /> View live site</a>
      </header>

      <nav className="dash-actions" aria-label="Quick actions">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href} className="dash-action">
            {action.create ? <Plus aria-hidden="true" /> : <ArrowUpRight aria-hidden="true" />}{action.label}
          </Link>
        ))}
      </nav>

      <Metrics section={overview.metrics} />

      <div className="dash-columns">
        <Health checks={health} />
        <RecentActivity section={overview.recentlyUpdated} />
      </div>
    </div>
  );
}
