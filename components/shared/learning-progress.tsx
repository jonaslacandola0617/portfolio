import Link from "next/link";
import { ExternalLink } from "lucide-react";
interface LearningItem { label:string; href:string; }
export function LearningProgress({ items }: { items: readonly LearningItem[] }) {
  return <div className="border border-border bg-surface-2">{items.map((item,i)=><Link key={item.label} href={item.href} className={`flex items-center justify-between gap-3 px-5 py-3.5 text-sm text-text-dim transition-colors hover:text-text ${i!==items.length-1?"border-b border-border":""}`}><span className="flex items-center gap-3"><span className="h-1.5 w-1.5 shrink-0 animate-pulse-node rounded-full bg-signal"/>{item.label}</span><ExternalLink size={12} className="shrink-0 text-muted-foreground"/></Link>)}</div>;
}
