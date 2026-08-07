import { Network, ShieldCheck, Terminal, Code2, Flag } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { TimelineEntry } from "@/types";
const cfg={networking:{icon:Network,cls:"bg-cobalt"},security:{icon:ShieldCheck,cls:"bg-vermilion"},linux:{icon:Terminal,cls:"bg-signal"},programming:{icon:Code2,cls:"bg-cobalt"},milestone:{icon:Flag,cls:"bg-teal"}} as const;
export function Timeline({ entries }: { entries: TimelineEntry[] }) {
 return <ol className="relative ml-3 border-l border-border pl-8 sm:pl-10">{entries.map((e,i)=>{const C=cfg[e.category]; const Icon=C.icon; return <li key={e.id} className="relative pb-10 last:pb-0"><span className={`absolute -left-[37px] top-1 h-2.5 w-2.5 rounded-full ${C.cls} sm:-left-[45px]`}/><div className="mb-2 flex items-center gap-3"><span className="idx">{String(i+1).padStart(2,"0")}</span><Icon size={13} className="text-cobalt"/><time className="font-mono text-xs text-muted-foreground">{formatDate(e.date)}</time></div><h3 className="font-display text-lg font-semibold text-text">{e.title}</h3><p className="mt-2 text-sm leading-relaxed text-text-dim">{e.description}</p>{e.tags?.length?<div className="mt-3 flex flex-wrap gap-1.5">{e.tags.map(t=><span key={t} className="label border border-border px-1.5 py-0.5">{t}</span>)}</div>:null}</li>})}</ol>;
}
