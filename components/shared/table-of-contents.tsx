import type { ContentHeading } from "@/lib/content-headings";
import { cn } from "@/lib/utils";

export function TableOfContents({ items, className }: { items: ContentHeading[]; className?: string }) {
  if (!items.length) return null;

  return (
    <nav className={cn("toc", className)} aria-label="On this page">
      <p className="footer-label">On this page</p>
      <ol>
        {items.map((item, index) => (
          <li key={`${item.id}-${index}`} className={item.level === 3 ? "is-sub" : undefined}>
            <a href={`#${item.id}`}>{item.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
