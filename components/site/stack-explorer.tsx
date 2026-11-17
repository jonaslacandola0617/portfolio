"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type StackProject = {
  title: string;
  slug: string;
  category: string;
  year: number;
  technologies: string[];
  live: boolean;
};

/**
 * Lets a reviewer pick a technology and see exactly which shipped work uses it,
 * so every skill claim is one click from its evidence.
 */
export function StackExplorer({ projects }: { projects: StackProject[] }) {
  const technologies = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const project of projects) {
      for (const technology of project.technologies) {
        const key = technology.trim().toLowerCase();
        if (!key) continue;
        const current = counts.get(key);
        counts.set(key, { label: current?.label ?? technology.trim(), count: (current?.count ?? 0) + 1 });
      }
    }
    return [...counts.entries()]
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, 18);
  }, [projects]);

  const [active, setActive] = useState<string | null>(technologies[0]?.key ?? null);
  const matches = (project: StackProject) =>
    active ? project.technologies.some((technology) => technology.trim().toLowerCase() === active) : true;
  const matchCount = projects.filter(matches).length;
  const activeLabel = technologies.find((technology) => technology.key === active)?.label;

  if (!technologies.length) return null;

  return (
    <div className="stack-explorer">
      <div className="stack-chips" role="group" aria-label="Filter work by technology">
        {technologies.map((technology) => (
          <button
            key={technology.key}
            type="button"
            aria-pressed={active === technology.key}
            onClick={() => setActive(active === technology.key ? null : technology.key)}
            className={cn("stack-chip", active === technology.key && "is-active")}
          >
            {technology.label}
            <span>{technology.count}</span>
          </button>
        ))}
      </div>

      <div className="stack-results">
        <p className="stack-results-head" aria-live="polite">
          {activeLabel ? (
            <><b>{activeLabel}</b> appears in {matchCount} of {projects.length} projects</>
          ) : (
            <>All {projects.length} projects</>
          )}
        </p>
        <ul>
          {projects.map((project) => {
            const on = matches(project);
            return (
              <li key={project.slug} className={cn("stack-row", !on && "is-dim")}>
                <Link href={`/projects/${project.slug}`} tabIndex={on ? 0 : -1}>
                  <span className="stack-row-title">{project.title}</span>
                  <span className="stack-row-meta">
                    {project.live ? <i className="live-dot" title="Live in production" /> : null}
                    {project.category} · {project.year}
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
