import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  ExternalLink,
  FilePlus2,
  FlaskConical,
  FolderGit2,
  GitCommitHorizontal,
  ImagePlus,
  Layers,
  NotebookPen,
  Settings,
} from "lucide-react";
import { auth } from "@/auth";
import { getDashboardOverview } from "@/lib/services/dashboard-service";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ContentTypeMetric, DashboardSection } from "@/types/admin";

const metricIcons = {
  projects: FolderGit2,
  labs: FlaskConical,
  articles: NotebookPen,
  certificates: BadgeCheck,
  timeline: GitCommitHorizontal,
  skills: Layers,
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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {section.data.map((metric) => {
        const Icon = metricIcons[metric.key];
        return (
          <Link key={metric.key} href={metric.href}>
            <Card className="h-full p-5 transition-colors hover:border-primary/40">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">{metric.label}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-3 font-display text-3xl font-semibold text-foreground">{metric.total}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
                {metric.details.map((detail) => (
                  <div key={detail.label} className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">{detail.value}</p>
                    <p className="mt-0.5 truncate font-mono text-[0.58rem] uppercase tracking-wide text-muted-foreground">{detail.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function relativeTime(value: string) {
  const delta = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(delta / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

export default async function AdminDashboardPage() {
  const [session, overview] = await Promise.all([auth(), getDashboardOverview()]);
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const healthVariant = overview.health === "connected" ? "success" : overview.health === "degraded" ? "warning" : "destructive";
  const publicationData = overview.publication.ok ? overview.publication.data : null;
  const publicationError = overview.publication.ok ? null : overview.publication.message;
  const publicationTotal = publicationData
    ? Object.values(publicationData).reduce((sum, value) => sum + value, 0)
    : 0;

  const quickActions = [
    { label: "New Project", detail: "Document a build", href: "/admin/projects/new", icon: FolderGit2 },
    { label: "New Lab", detail: "Capture lab work", href: "/admin/labs/new", icon: FlaskConical },
    { label: "New Article", detail: "Write a journal entry", href: "/admin/journal/new", icon: FilePlus2 },
    { label: "Upload Media", detail: "Add files and images", href: "/admin/media", icon: ImagePlus },
    { label: "Edit Settings", detail: "Update site identity", href: "/admin/settings", icon: Settings },
    { label: "Open Public Site", detail: "View the portfolio", href: "/", icon: ExternalLink },
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 md:px-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Welcome back, {firstName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Portfolio content, publishing state, and items that need review.</p>
        </div>
        <Badge variant={healthVariant}>Database {overview.health}</Badge>
      </div>

      <Metrics section={overview.metrics} />

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <h2 className="font-display text-base font-semibold text-foreground">Publishing status</h2>
          <p className="mt-1 text-xs text-muted-foreground">Across projects, labs, articles, certificates, and timeline entries.</p>
          {publicationData ? (
            <div className="mt-5 space-y-3">
              {(["PUBLISHED", "DRAFT", "SCHEDULED", "ARCHIVED"] as const).map((status) => {
                const count = publicationData[status];
                const width = publicationTotal ? `${(count / publicationTotal) * 100}%` : "0%";
                return (
                  <div key={status}>
                    <div className="mb-1.5 flex justify-between font-mono text-[0.65rem] uppercase tracking-wide">
                      <span className="text-muted-foreground">{status}</span><span className="text-foreground">{count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary/75" style={{ width }} />
                    </div>
                  </div>
                );
              })}
              {publicationData.SCHEDULED > 0 && (
                <p className="rounded-md border border-warning/25 bg-warning/5 px-3 py-2 text-xs text-warning">
                  Legacy Scheduled records remain. Scheduling is disabled; return these items to Draft.
                </p>
              )}
            </div>
          ) : <div className="mt-4"><SectionFailure message={publicationError ?? "Publishing status could not be loaded."} /></div>}
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-base font-semibold text-foreground">Needs attention</h2>
          <p className="mt-1 text-xs text-muted-foreground">Reproducible checks against current content.</p>
          {overview.attention.ok ? (
            overview.attention.data.length ? (
              <div className="mt-4 divide-y divide-border">
                {overview.attention.data.map((item) => (
                  <Link key={item.id} href={item.href} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <span className={`flex h-7 min-w-7 items-center justify-center rounded-md border text-xs font-semibold ${item.severity === "warning" ? "border-warning/30 bg-warning/5 text-warning" : "border-primary/25 bg-primary/5 text-primary"}`}>{item.count}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">{item.label}</span>
                      <span className="block text-xs text-muted-foreground">{item.detail}</span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : <p className="mt-5 text-sm text-muted-foreground">No current content checks need attention.</p>
          ) : <div className="mt-4"><SectionFailure message={overview.attention.message} /></div>}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display text-base font-semibold text-foreground">Recently Updated Content</h2>
            <p className="mt-1 text-xs text-muted-foreground">Derived from record timestamps; this is not an activity log.</p>
          </div>
          {overview.recentlyUpdated.ok ? (
            overview.recentlyUpdated.data.length ? (
              <div className="divide-y divide-border">
                {overview.recentlyUpdated.data.map((item) => (
                  <Link key={`${item.type}-${item.id}`} href={item.href} className="grid gap-1 px-5 py-3 transition-colors hover:bg-accent sm:grid-cols-[6rem_1fr_auto_auto] sm:items-center sm:gap-3">
                    <span className="font-mono text-[0.62rem] tracking-wide text-primary">{item.type}</span>
                    <span className="truncate text-sm font-medium text-foreground">{item.title}</span>
                    <Badge variant="outline">{item.status}</Badge>
                    <span className="text-xs text-muted-foreground">{relativeTime(item.updatedAt)}</span>
                  </Link>
                ))}
              </div>
            ) : <p className="px-5 py-8 text-sm text-muted-foreground">No timestamped content yet.</p>
          ) : <div className="p-5"><SectionFailure message={overview.recentlyUpdated.message} /></div>}
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-base font-semibold text-foreground">Quick actions</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href} className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5 transition-colors hover:border-primary/35 hover:bg-accent">
                <action.icon className="h-4 w-4 shrink-0 text-primary" />
                <span><span className="block text-sm font-medium text-foreground">{action.label}</span><span className="block text-xs text-muted-foreground">{action.detail}</span></span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
