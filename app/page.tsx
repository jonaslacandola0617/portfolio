import Link from "next/link";
import { ArrowUpRight, Download, FolderGit2, FlaskConical, NotebookPen, BadgeCheck } from "lucide-react";
import { LearningProgress } from "@/components/shared/learning-progress";
import { RecentActivityCard } from "@/components/shared/recent-activity-card";
import { ProjectCard } from "@/components/shared/project-card";
import { LabCard } from "@/components/shared/lab-card";
import { NetworkDiagram } from "@/components/shared/network-diagram";
import { SectionLabel } from "@/components/shared/page-header";
import { Tag } from "@/components/shared/tag";
import { siteConfig } from "@/lib/site-config";
import { getAllProjects, getAllArticles, getAllLabs } from "@/lib/content";
import { getHomepageOverview } from "@/lib/db/queries/homepage";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { formatDate } from "@/lib/utils";

export default async function HomePage() {
  const [projects, allArticles, allLabs, settings, homepage] = await Promise.all([
    getAllProjects(), getAllArticles(), getAllLabs(), getSiteSettings(), getHomepageOverview(),
  ]);
  const featuredProjects = projects.slice(0, 2);
  const articles = allArticles.slice(0, 3);
  const latestLab = allLabs[0];
  const statLinks = ["/projects", "/labs", "/journal", "/certifications"];
  const statIcons = [FolderGit2, FlaskConical, NotebookPen, BadgeCheck];

  return <div>
    <section className="relative overflow-hidden border-b border-border">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-[1.3fr_1fr] lg:px-14 lg:py-24">
        <div>
          <div className="mb-6 flex items-center gap-3 animate-rise-in" style={{animationDuration:"400ms"}}><span className="idx">00</span><span className="label">{siteConfig.location}</span></div>
          <h1 className="font-display text-5xl font-semibold leading-[1.02] text-text sm:text-6xl lg:text-7xl animate-rise-in" style={{animationDelay:"50ms"}}>{settings.name}</h1>
          <p className="mt-4 flex items-center gap-3 font-display text-xl text-cobalt sm:text-2xl animate-rise-in" style={{animationDelay:"150ms"}}><span className="h-2 w-2 shrink-0 bg-vermilion" aria-hidden="true"/>{settings.role}</p>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-text-dim sm:text-lg animate-rise-in" style={{animationDelay:"200ms"}}>{settings.tagline}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3 animate-rise-in" style={{animationDelay:"280ms"}}>
            <Link href="/projects" className="group flex items-center gap-2 border border-border-strong bg-text px-5 py-3 text-sm font-medium text-surface transition-opacity hover:opacity-85">View Projects <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/></Link>
            <Link href="/resume" className="flex items-center gap-2 border border-border px-5 py-3 text-sm font-medium text-text transition-colors hover:border-border-strong"><Download size={15}/> Résumé</Link>
            <Link href="/contact" className="px-2 py-3 text-sm font-medium text-text-dim underline decoration-border underline-offset-4 hover:text-text">Get in touch</Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-1.5 animate-rise-in" style={{animationDelay:"400ms"}}>{siteConfig.currentFocusStack.map(s=><Tag key={s}>{s}</Tag>)}</div>
        </div>
        <div className="relative flex items-center justify-center border border-border bg-surface-2 p-6">
          <div className="absolute left-3 top-3 label">Network Topology — Live</div>
          <div className="h-56 w-full sm:h-64"><NetworkDiagram/></div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 label text-teal"><span className="h-1.5 w-1.5 animate-pulse-node rounded-full bg-teal"/>Available for opportunities</div>
        </div>
      </div>
    </section>

    <section className="grid grid-cols-2 divide-x divide-y divide-border border-b border-border sm:grid-cols-4 sm:divide-y-0">
      {homepage.stats.map((s,i)=>{const Icon=statIcons[i]??FolderGit2;return <Link key={s.label} href={statLinks[i]??"/"} className="group flex flex-col gap-2 px-6 py-8 transition-colors hover:bg-surface-2 sm:px-8"><Icon size={16} className="text-cobalt"/><span className="font-display text-3xl font-semibold text-text sm:text-4xl">{s.value}</span><span className="label flex items-center gap-1">{s.label}<ArrowUpRight size={11} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/></span></Link>})}
    </section>

    <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:px-14">
      <div className="mb-20 grid grid-cols-1 gap-10 lg:grid-cols-2"><div><SectionLabel index="01" title="Currently Learning"/><LearningProgress items={settings.currentlyLearning}/></div><div><SectionLabel index="02" title="Recent Activity"/><RecentActivityCard activity={homepage.recentActivity}/></div></div>
      <div className="mb-20"><SectionLabel index="03" title="Featured Projects"/><div className="grid grid-cols-1 gap-5 sm:grid-cols-2">{featuredProjects.map((p,i)=><ProjectCard key={p.frontmatter.slug} project={p.frontmatter} index={i+1} size="featured"/>)}</div><Link href="/projects" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-text hover:text-cobalt">View all projects <ArrowUpRight size={14}/></Link></div>
      {latestLab&&<div className="mb-20"><SectionLabel index="04" title="Latest Lab"/><LabCard lab={latestLab.frontmatter} index={1}/></div>}
      <div className="mb-20"><SectionLabel index="05" title="Journal"/><div className="divide-y divide-border border-y border-border">{articles.map((a,i)=><Link key={a.frontmatter.slug} href={`/journal/${a.frontmatter.slug}`} className="group flex flex-col gap-2 px-1 py-5 sm:flex-row sm:items-center sm:gap-6"><span className="idx w-6 shrink-0">{String(i+1).padStart(2,"0")}</span><span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">{formatDate(a.frontmatter.date)}</span><h3 className="flex-1 font-display text-base font-medium text-text group-hover:text-cobalt sm:text-lg">{a.frontmatter.title}</h3><span className="label shrink-0">{a.readingTime}</span></Link>)}</div></div>
      <div className="relative overflow-hidden border border-border-strong bg-text px-8 py-14 text-surface sm:px-14"><div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cobalt opacity-20"/><div className="absolute -bottom-14 -left-6 h-32 w-32 bg-vermilion opacity-20"/><div className="relative max-w-xl"><span className="label text-surface/60">06 — Let&apos;s Talk</span><h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Reviewing candidates for SOC, NetAdmin, or IT Support roles?</h2><p className="mt-4 text-surface/70">Every project and lab on this site is documented the way I&apos;d document real work — objective, steps, evidence, and what I&apos;d do differently.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/resume" className="border border-surface bg-surface px-5 py-3 text-sm font-medium text-ink">Review résumé</Link><Link href="/contact" className="border border-surface/40 px-5 py-3 text-sm font-medium text-surface">Contact me</Link></div></div></div>
    </div>
  </div>;
}
