import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface RelatedItem {
  title: string;
  href: string;
  meta?: string;
}

export function RelatedContent({ title = "Related", items }: { title?: string; items: RelatedItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="mt-10 border-t border-border pt-8">
      <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-text-dim">
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center justify-between gap-3 border border-border bg-surface-2 px-4 py-3 transition-colors hover:border-cobalt/40"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-text group-hover:text-cobalt transition-colors">
                {item.title}
              </div>
              {item.meta && <div className="font-mono text-[0.68rem] text-text-dim">{item.meta}</div>}
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-text-dim/50 transition-transform group-hover:translate-x-0.5 group-hover:text-cobalt" />
          </Link>
        ))}
      </div>
    </div>
  );
}
