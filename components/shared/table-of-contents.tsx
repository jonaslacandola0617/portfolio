"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { List } from "lucide-react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ containerId = "article-content" }: { containerId?: string }) {
  const [headings, setHeadings] = React.useState<Heading[]>([]);
  const [activeId, setActiveId] = React.useState<string>("");

  React.useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const elements = Array.from(container.querySelectorAll("h2, h3")) as HTMLElement[];
    setHeadings(
      elements.map((el) => ({
        id: el.id,
        text: el.textContent?.replace("#", "").trim() ?? "",
        level: el.tagName === "H2" ? 2 : 3,
      }))
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-96px 0px -70% 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [containerId]);

  if (headings.length < 2) return null;

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin">
      <div className="mb-3 flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-widest text-muted">
        <List className="h-3.5 w-3.5" />
        On this page
      </div>
      <ul className="space-y-2 border-l border-border">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: h.level === 3 ? "1.75rem" : "1rem" }}>
            <a
              href={`#${h.id}`}
              className={cn(
                "block -ml-px border-l-2 pl-3 py-0.5 text-sm transition-colors",
                activeId === h.id
                  ? "border-cobalt text-cobalt font-medium"
                  : "border-transparent text-text-dim hover:text-text"
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
