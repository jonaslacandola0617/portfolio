import Link from "next/link";
import { FolderGit2, FlaskConical, NotebookPen, GitCommitHorizontal } from "lucide-react";
import type { HomepageActivity } from "@/lib/db/queries/homepage";
import { formatDate } from "@/lib/utils";
const icons={project:FolderGit2,lab:FlaskConical,article:NotebookPen,certificate:GitCommitHorizontal} as const;
export function RecentActivityCard({ activity }: { activity: HomepageActivity[] }) {
 return <div className="border border-border bg-surface-2">{activity.length===0?<p className="px-5 py-8 text-sm text-text-dim">No published portfolio activity yet.</p>:activity.map((a,i)=>{const Icon=icons[a.type as keyof typeof icons]??GitCommitHorizontal;return <Link key={`${a.type}-${a.id}`} href={a.href} className={`flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-3 ${i!==activity.length-1?"border-b border-border":""}`}><Icon size={14} className="shrink-0 text-cobalt"/><span className="min-w-0 flex-1 truncate text-sm text-text">{a.title}</span><span className="shrink-0 font-mono text-xs text-muted-foreground">{formatDate(a.updatedAt)}</span></Link>})}</div>;
}
