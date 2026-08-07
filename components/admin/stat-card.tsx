import type { LucideIcon } from "lucide-react";
import Link from "next/link";

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
    <Link
      href={href}
      className="border border-border bg-surface-2 p-5 transition-colors hover:border-border-strong"
    >
      <Icon className="mb-3 h-4 w-4 text-cobalt" />
      <p className="font-display text-3xl font-semibold text-text">{value}</p>
      <p className="label mt-1">{label}</p>
    </Link>
  );
}
