import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DifficultyBadge, StatusBadge } from "@/components/shared/status-badges";
import { Tag } from "@/components/shared/tag";
import { formatDate } from "@/lib/utils";
import type { ProjectFrontmatter } from "@/types";

function accent(category: string) {
  const c=category.toLowerCase();
  if(c.includes("security")) return "bg-vermilion";
  if(c.includes("software")||c.includes("web")) return "bg-signal";
  return "bg-cobalt";
}
export function ProjectCard({ project, index=1, size="regular" }: { project: ProjectFrontmatter; index?: number; size?: "regular"|"featured" }) {
  return <Link href={`/projects/${project.slug}`} className={`group relative flex flex-col border border-border bg-surface-2 p-6 transition-colors duration-200 hover:border-border-strong ${size==="featured"?"sm:p-8":""}`}>
    <span className={`absolute left-0 top-0 h-1 w-10 ${accent(project.category)}`} aria-hidden="true" />
    <div className="mb-4 flex items-center justify-between"><span className="idx">{String(index).padStart(2,"0")}</span><StatusBadge status={project.status} /></div>
    <h3 className={`font-display font-semibold text-text transition-transform duration-200 group-hover:translate-x-0.5 ${size==="featured"?"text-2xl":"text-lg"}`}>{project.title}</h3>
    <p className="mt-3 flex-1 text-sm leading-relaxed text-text-dim">{project.summary}</p>
    <div className="mt-5 flex flex-wrap gap-1.5">{project.tags.map(t=><Tag key={t}>{t}</Tag>)}</div>
    <div className="mt-5 flex items-center justify-between border-t border-border pt-4"><div className="flex items-center gap-3 text-xs text-muted-foreground"><DifficultyBadge difficulty={project.difficulty}/><span className="font-mono">{formatDate(project.completionDate)}</span></div><ArrowUpRight size={16} className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cobalt" /></div>
  </Link>;
}
