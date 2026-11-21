import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { RelatedContentItem } from "@/lib/related-content";

export function RelatedContentLinks({ items }: { items: RelatedContentItem[] }) {
  if (!items.length) return null;

  return (
    <section className="related" aria-labelledby="related-content-heading">
      <h2 id="related-content-heading" className="related-title">Related</h2>
      <div className="related-grid">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="related-card">
            <span className="related-type">{item.type}</span>
            <strong>{item.title}</strong>
            <p>{item.summary}</p>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
