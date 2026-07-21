import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  href,
  icon: Icon,
}: {
  label: string;
  value: number;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <Link href={href}>
      <Card className="p-5 transition-colors hover:border-primary/40">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[0.68rem] uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="mt-2 font-display text-3xl font-semibold text-foreground">{value}</div>
      </Card>
    </Link>
  );
}
