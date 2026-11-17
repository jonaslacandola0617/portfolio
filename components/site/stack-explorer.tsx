"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type EvidenceItem = {
  title: string;
  href: string;
  kind: "Lab" | "Project" | "Certification";
  year?: number;
  /** Skills, tools and topics this item demonstrates. */
  keys: string[];
  live?: boolean;
};

const KIND_ORDER: EvidenceItem["kind"][] = ["Lab", "Certification", "Project"];

/**
 * Lets a reviewer pick a skill and see exactly which labs, credentials and
 * projects demonstrate it, so every claim is one click from its evidence.
 */
export function StackExplorer({ items, preferred = [] }: { items: EvidenceItem[]; preferred?: string[] }) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind)),
    [items],
  );

  const skills = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const item of items) {
      const seen = new Set<string>();
      for (const raw of item.keys) {
        const key = raw.trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        const current = counts.get(key);
        counts.set(key, { label: current?.label ?? raw.trim(), count: (current?.count ?? 0) + 1 });
      }
    }
    const boost = new Set(preferred.map((value) => value.toLowerCase()));
    return [...counts.entries()]
      .map(([key, value]) => ({ key, ...value, boosted: boost.has(key) }))
      .sort((a, b) => Number(b.boosted) - Number(a.boosted) || b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, 20);
  }, [items, preferred]);

  const [active, setActive] = useState<string | null>(skills[0]?.key ?? null);
  const matches = (item: EvidenceItem) => (active ? item.keys.some((key) => key.trim().toLowerCase() === active) : true);
  const matchCount = items.filter(matches).length;
  const activeLabel = skills.find((skill) => skill.key === active)?.label;

  if (!skills.length) return null;

  return (
    <div className="stack-explorer">
      <div className="stack-chips" role="group" aria-label="Filter evidence by skill">
        {skills.map((skill) => (
          <button
            key={skill.key}
            type="button"
            aria-pressed={active === skill.key}
            onClick={() => setActive(active === skill.key ? null : skill.key)}
            className={cn("stack-chip", active === skill.key && "is-active")}
          >
            {skill.label}
            <span>{skill.count}</span>
          </button>
        ))}
      </div>

      <div className="stack-results">
        <p className="stack-results-head" aria-live="polite">
          {activeLabel ? (
            <><b>{activeLabel}</b> shows up in {matchCount} of {items.length} labs, credentials and projects</>
          ) : (
            <>Everything — {items.length} items</>
          )}
        </p>
        <ul>
          {sorted.map((item) => {
            const on = matches(item);
            return (
              <li key={`${item.kind}:${item.href}:${item.title}`} className={cn("stack-row", !on && "is-dim")}>
                <Link href={item.href} tabIndex={on ? 0 : -1}>
                  <span className="stack-row-title">{item.title}</span>
                  <span className="stack-row-meta">
                    {item.live ? <i className="live-dot" title="Live in production" /> : null}
                    <span className={cn("kind-tag", `kind-${item.kind.toLowerCase()}`)}>{item.kind}</span>
                    {item.year ? <span>{item.year}</span> : null}
                  </span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
