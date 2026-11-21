"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type EvidenceItem = {
  title: string;
  href: string;
  kind: "Experience" | "Lab" | "Project" | "Certification";
  year?: number;
  /** Skills, tools and topics this item demonstrates. */
  keys: string[];
  live?: boolean;
};

const KIND_ORDER: EvidenceItem["kind"][] = ["Experience", "Lab", "Certification", "Project"];
/** Skill buttons shown before "More skills". */
const CHIP_LIMIT = 12;
/** Items listed when no skill is selected, before "Show all". */
const UNFILTERED_LIMIT = 6;

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
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);

  const matches = (item: EvidenceItem) => (active ? item.keys.some((key) => key.trim().toLowerCase() === active) : true);
  const results = sorted.filter(matches);
  const activeLabel = skills.find((skill) => skill.key === active)?.label;

  // Keep the selected skill visible even when the chip list is collapsed.
  const activeIndex = skills.findIndex((skill) => skill.key === active);
  const chips = showAllSkills || skills.length <= CHIP_LIMIT
    ? skills
    : activeIndex >= CHIP_LIMIT
      ? [...skills.slice(0, CHIP_LIMIT - 1), skills[activeIndex]]
      : skills.slice(0, CHIP_LIMIT);
  const visibleResults = active || showAllItems ? results : results.slice(0, UNFILTERED_LIMIT);

  if (!skills.length) return null;

  return (
    <div className="stack-explorer">
      <div className="stack-picker">
        <div className="stack-chips" role="group" aria-label="Filter by skill">
          {chips.map((skill) => (
            <button
              key={skill.key}
              type="button"
              aria-pressed={active === skill.key}
              onClick={() => { setActive(active === skill.key ? null : skill.key); setShowAllItems(false); }}
              className={cn("stack-chip", active === skill.key && "is-active")}
            >
              {skill.label}
              <span>{skill.count}</span>
            </button>
          ))}
        </div>
        {skills.length > CHIP_LIMIT ? (
          <button type="button" className="stack-more" onClick={() => setShowAllSkills((value) => !value)} aria-expanded={showAllSkills}>
            {showAllSkills ? "Fewer skills" : `More skills (${skills.length - CHIP_LIMIT})`}
          </button>
        ) : null}
      </div>

      <div className="stack-results">
        <div className="stack-results-head">
          <p aria-live="polite">
            {activeLabel ? (
              <><b>{activeLabel}</b> · {results.length} {results.length === 1 ? "result" : "results"}</>
            ) : (
              <>Pick a skill to filter · {items.length} items</>
            )}
          </p>
          {active ? (
            <button type="button" className="stack-clear" onClick={() => { setActive(null); setShowAllItems(false); }}>
              Clear <X size={13} aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <ul key={active ?? "all"}>
          {visibleResults.map((item, index) => (
            <li key={`${item.kind}:${item.href}:${item.title}`} className="stack-row" style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}>
              <Link href={item.href}>
                <span className="stack-row-title">{item.title}</span>
                <span className="stack-row-meta">
                  {item.live ? <i className="live-dot" title="Live in production" /> : null}
                  <span className={cn("kind-tag", `kind-${item.kind.toLowerCase()}`)}>{item.kind}</span>
                  {item.year ? <span>{item.year}</span> : null}
                </span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
        {!active && results.length > UNFILTERED_LIMIT ? (
          <button type="button" className="stack-show-all" onClick={() => setShowAllItems((value) => !value)} aria-expanded={showAllItems}>
            {showAllItems ? "Show fewer" : `Show all ${results.length}`}
          </button>
        ) : null}
      </div>
    </div>
  );
}
