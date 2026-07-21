import { FolderGit2, FlaskConical, NotebookPen, BadgeCheck, Activity } from "lucide-react";
import { auth } from "@/auth";
import { getDashboardOverview } from "@/lib/services/dashboard-service";
import { StatCard } from "@/components/admin/stat-card";
import { EmptyState } from "@/components/admin/empty-state";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboardPage() {
  const session = await auth();
  const overview = await getDashboardOverview();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Content management — Phase 1 (auth &amp; shell). CRUD screens arrive in Phase 2.
          </p>
        </div>
        {!overview.dbConnected && (
          <Badge variant="warning">Database not connected — showing zero-state</Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Projects" value={overview.counts.projects} href="/admin/projects" icon={FolderGit2} />
        <StatCard label="Labs" value={overview.counts.labs} href="/admin/labs" icon={FlaskConical} />
        <StatCard label="Journal" value={overview.counts.articles} href="/admin/journal" icon={NotebookPen} />
        <StatCard label="Certificates" value={overview.counts.certificates} href="/admin/certificates" icon={BadgeCheck} />
      </div>

      <div className="mt-10">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent Activity
        </h2>
        {overview.recentActivity.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description="Every create, edit, and publish will show up here once content management ships in Phase 2."
          />
        ) : (
          <ul className="space-y-2">
            {overview.recentActivity.map((item) => (
              <li key={item.id} className="rounded-md border border-border bg-card px-4 py-3 text-sm">
                {item.actor} {item.action} {item.contentType} &ldquo;{item.contentTitle}&rdquo;
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
