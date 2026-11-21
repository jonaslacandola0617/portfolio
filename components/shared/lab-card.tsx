import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/site/interactive";
import { LabTopology } from "@/components/site/lab-topology";
import { StatusBadge } from "@/components/shared/status-badges";
import { formatDateShort } from "@/lib/utils";
import type { LabFrontmatter } from "@/types";

/** Lab card with a generated network diagram. Used on the homepage, /labs and tag pages. */
export function LabCard({ lab, index = 0, headingLevel = "h3" }: { lab: LabFrontmatter; index?: number; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <Reveal as="article" className="lab-card" delay={Math.min(index, 6) * 70}>
      <Link href={`/labs/${lab.slug}`} className="lab-card-link">
        <div className="lab-card-visual">
          <LabTopology seed={lab.slug} className="lab-topology" />
          <span className="lab-card-index">LAB {String(index + 1).padStart(2, "0")}</span>
        </div>
        <div className="lab-card-body">
          <p className="work-meta">
            <span>{lab.category}</span>
            <StatusBadge status={lab.status} />
            <span>{formatDateShort(lab.date)}</span>
          </p>
          <Heading className="lab-card-title">{lab.title}</Heading>
          <p>{lab.purpose}</p>
          {lab.tags.length ? <ul className="chip-list">{lab.tags.slice(0, 4).map((tag) => <li key={tag}>{tag}</li>)}</ul> : null}
          <span className="text-link">Read lab notes <ArrowRight size={14} /></span>
        </div>
      </Link>
    </Reveal>
  );
}
