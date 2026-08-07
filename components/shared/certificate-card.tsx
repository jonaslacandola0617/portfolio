import { BadgeCheck, ExternalLink } from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import type { Certification } from "@/types";
import { ContentRenderer } from "@/components/shared/content-renderer";
export function CertificateCard({ cert, index=1 }: { cert: Certification; index?: number }) {
  return <div className="group relative border border-border bg-surface-2 p-6 transition-colors hover:border-border-strong">
    <div className="mb-5 flex items-center justify-between"><span className="idx">{String(index).padStart(2,"0")}</span>{cert.logoUrl?<img src={cert.logoUrl} alt={`${cert.issuer} logo`} className="h-10 w-10 object-contain"/>:<BadgeCheck size={20} className="text-cobalt"/>}</div>
    <h3 className="font-display text-base font-semibold leading-snug text-text">{cert.name}</h3><p className="mt-1.5 label">{cert.issuer}</p>
    <div className="mt-4 flex flex-wrap gap-1.5">{cert.skills.slice(0,3).map(s=><span key={s} className="border border-border px-1.5 py-0.5 text-[11px] text-text-dim">{s}</span>)}</div>
    <div className="mt-5 flex items-center justify-between border-t border-border pt-3"><span className="font-mono text-xs text-muted-foreground">{cert.dateCompleted?`Completed ${formatDateShort(cert.dateCompleted)}`:cert.dateStarted?`Started ${formatDateShort(cert.dateStarted)}`:"In progress"}</span>{cert.credentialUrl?<a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="label flex items-center gap-1 text-cobalt">Credential <ExternalLink size={11}/></a>:<span className="label text-signal">In progress</span>}</div>
    {cert.content!=null&&<div className="mt-5 border-t border-border pt-5"><ContentRenderer content={cert.content} context={{model:"Certificate",slug:cert.id,title:cert.name}}/></div>}
  </div>;
}
