import Link from "next/link";
import { ArrowRight, Download, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LearningProgress } from "@/components/shared/learning-progress";
import { RecentActivityCard } from "@/components/shared/recent-activity-card";
import { ProjectCard } from "@/components/shared/project-card";
import { LabCard } from "@/components/shared/lab-card";
import { NetworkTopology } from "@/components/shared/network-topology";
import { siteConfig } from "@/lib/site-config";
import { getAllProjects, getAllArticles, getAllLabs } from "@/lib/content";
import { getHomepageOverview } from "@/lib/db/queries/homepage";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { formatDate } from "@/lib/utils";

const heroTopologyNodes = [
  { id: "isp", kind: "internet" as const, label: "ISP", x: 60, y: 60 },
  { id: "fw", kind: "firewall" as const, label: "FW", x: 190, y: 60 },
  { id: "r1", kind: "router" as const, label: "R1", x: 320, y: 60 },
  { id: "sw1", kind: "switch" as const, label: "SW1", x: 260, y: 170 },
  { id: "sw2", kind: "switch" as const, label: "SW2", x: 400, y: 170 },
  { id: "pc1", kind: "pc" as const, label: "VLAN 10", x: 220, y: 270 },
  { id: "pc2", kind: "pc" as const, label: "VLAN 20", x: 320, y: 270 },
  { id: "srv", kind: "server" as const, label: "VLAN 99", x: 420, y: 270 },
];

const heroTopologyEdges = [
  { from: "isp", to: "fw" },
  { from: "fw", to: "r1" },
  { from: "r1", to: "sw1" },
  { from: "r1", to: "sw2" },
  { from: "sw1", to: "pc1" },
  { from: "sw1", to: "pc2" },
  { from: "sw2", to: "srv" },
];

export default async function HomePage() {
  const [projects, allArticles, allLabs, settings, homepage] =
    await Promise.all([
      getAllProjects(),
      getAllArticles(),
      getAllLabs(),
      getSiteSettings(),
      getHomepageOverview(),
    ]);
  const featuredProjects = projects.slice(0, 3);
  const articles = allArticles.slice(0, 2);
  const latestLab = allLabs[0];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-grid">
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background to-background" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 md:px-10 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
              open to SOC / NetAdmin roles
            </div>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl text-balance">
              Hi, I&rsquo;m {settings.name}.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground text-balance">
              {settings.tagline.toLowerCase()}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {siteConfig.currentFocusStack.map((item) => (
                <Badge key={item} variant="primary">
                  {item}
                </Badge>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/projects">
                  View Projects <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/journal">
                  Read Journal <NotebookPen className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={settings.resumeUrl} download>
                  Download Resume <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {homepage.stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="font-mono text-[0.68rem] uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 font-display text-2xl font-semibold text-foreground">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="hidden lg:block">
            <div className="rounded-xl border border-border bg-card/60 p-4 animate-drift">
              <NetworkTopology
                nodes={heroTopologyNodes}
                edges={heroTopologyEdges}
                height={300}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-14 md:px-10">
        {/* Widgets row */}
        <div className="grid gap-5 md:grid-cols-2">
          <LearningProgress items={settings.currentlyLearning} />
          <RecentActivityCard activity={homepage.recentActivity} />
        </div>

        {/* Recent projects */}
        <div className="mt-14">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Recent Projects
            </h2>
            <Link
              href="/projects"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProjects.map((p) => (
              <ProjectCard key={p.frontmatter.slug} project={p.frontmatter} />
            ))}
          </div>
        </div>

        {/* Latest lab + recent articles */}
        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Latest Lab
              </h2>
              <Link
                href="/labs"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {latestLab && <LabCard lab={latestLab.frontmatter} />}
          </div>

          <div>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Recent Journal Entries
              </h2>
              <Link
                href="/journal"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {articles.map((a) => (
                <Link
                  key={a.frontmatter.slug}
                  href={`/journal/${a.frontmatter.slug}`}
                  className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <NotebookPen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {a.frontmatter.title}
                    </div>
                    <div className="mt-1 flex items-center gap-2 font-mono text-[0.68rem] text-muted-foreground">
                      <time>{formatDate(a.frontmatter.date)}</time>
                      <span>&middot;</span>
                      <span>{a.readingTime}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
