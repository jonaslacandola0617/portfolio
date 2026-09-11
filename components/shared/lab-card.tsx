import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badges";
import { formatDate } from "@/lib/utils";
import type { LabFrontmatter } from "@/types";

export function LabCard({ lab, index=1 }: { lab: LabFrontmatter; index?: number }) {
  return (
    <Link href={`/labs/${lab.slug}`} className="lab-index-row">
      <span className="lab-index-number">{String(index).padStart(2,"0")}</span>
      <div className="lab-index-marker" aria-hidden="true"><span /><i /></div>
      <div className="lab-index-copy">
        <div className="lab-index-meta"><span>{lab.category}</span><StatusBadge status={lab.status}/><span>{formatDate(lab.date)}</span></div>
        <h3>{lab.title}</h3>
        <p>{lab.purpose}</p>
        <div className="lab-index-tags">{lab.tags.slice(0,5).map((tag)=><span key={tag}>{tag}</span>)}</div>
      </div>
      <ArrowUpRight className="lab-index-arrow" size={17}/>
    </Link>
  );
}
