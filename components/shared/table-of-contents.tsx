import type { ContentHeading } from "@/lib/content-headings";

export function TableOfContents({ items }: { items: ContentHeading[] }) {
  if (!items.length) return null;

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto border-l border-border pl-5 pr-1 scrollbar-thin">
        <p className="label mb-4">On this page</p>
        <nav aria-label="Table of contents">
          <ol className="space-y-2.5">
            {items.map((item, index) => (
              <li key={`${item.id}-${index}`} className={item.level === 3 ? "pl-3" : undefined}>
                <a
                  href={`#${item.id}`}
                  className="group flex items-start gap-2 text-xs leading-5 text-muted transition-colors hover:text-text"
                >
                  <span className="mt-px shrink-0 font-mono text-[10px] text-text-dim group-hover:text-cobalt">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{item.text}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </aside>
  );
}
