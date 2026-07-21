import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DifficultyBadge, StatusBadge } from "@/components/shared/status-badges";
import { formatDate } from "@/lib/utils";
import type { LabFrontmatter } from "@/types";

export function LabCard({ lab }: { lab: LabFrontmatter }) {
  return (
    <Link href={`/labs/${lab.slug}`} className="group block">
      <Card className="h-full p-5 transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted/40">
            <FlaskConical className="h-4 w-4 text-primary" />
          </div>
          <StatusBadge status={lab.status} />
        </div>
        <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors">
          {lab.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{lab.purpose}</p>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <DifficultyBadge difficulty={lab.difficulty} />
          <time className="font-mono text-[0.68rem] text-muted-foreground">{formatDate(lab.date)}</time>
        </div>
      </Card>
    </Link>
  );
}
