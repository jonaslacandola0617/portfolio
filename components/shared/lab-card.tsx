import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badges";
import { Tag } from "@/components/shared/tag";
import { formatDate } from "@/lib/utils";
import type { LabFrontmatter } from "@/types";
export function LabCard({ lab, index=1 }: { lab: LabFrontmatter; index?: number }) {
  return <Link href={`/labs/${lab.slug}`} className="group flex gap-5 border border-border bg-surface-2 p-6 transition-colors hover:border-border-strong">
    <div className="hidden shrink-0 flex-col items-center gap-2 sm:flex"><span className="idx">{String(index).padStart(2,"0")}</span><span className="h-full w-px flex-1 bg-border"/><span className="h-2 w-2 rounded-full bg-cobalt"/></div>
    <div className="min-w-0 flex-1"><div className="mb-2 flex items-center justify-between gap-3"><span className="label text-cobalt">{lab.category}</span><StatusBadge status={lab.status}/></div><h3 className="font-display text-lg font-semibold text-text transition-transform duration-200 group-hover:translate-x-0.5">{lab.title}</h3><p className="mt-2 text-sm leading-relaxed text-text-dim">{lab.purpose}</p><div className="mt-4 flex flex-wrap items-center gap-1.5">{lab.tags.map(t=><Tag key={t}>{t}</Tag>)}<span className="ml-auto font-mono text-xs text-muted-foreground">{formatDate(lab.date)}</span><ArrowUpRight size={14} className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cobalt"/></div></div>
  </Link>;
}
