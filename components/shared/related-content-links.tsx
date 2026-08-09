import Link from "next/link";
import type { RelatedContentItem } from "@/lib/related-content";

export function RelatedContentLinks({ items }: { items: RelatedContentItem[] }) {
  if (!items.length) return null;

  return (
    <section className="mt-12 border-t border-border pt-8" aria-labelledby="related-content-heading">
      <p id="related-content-heading" className="idx mb-4">
        Related Work
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="border border-border bg-surface-2 p-4 transition-colors hover:border-border-strong"
          >
            <p className="label mb-1.5 text-cobalt">{item.type}</p>
            <p className="font-display text-sm font-semibold text-text">{item.title}</p>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-text-dim">{item.summary}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
