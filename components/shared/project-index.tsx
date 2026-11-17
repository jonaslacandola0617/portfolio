"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Github, Sparkles } from "lucide-react";
import { ProjectVisualPreview } from "@/components/shared/project-visual-preview";
import { TiltFrame } from "@/components/site/interactive";
import { AI_ASSISTED_CATEGORY, aiAssistedNote } from "@/lib/profile";
import type { ProjectFrontmatter } from "@/types";

export function ProjectIndex({ projects }: { projects: ProjectFrontmatter[] }) {
  const categories = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const project of projects) {
      const label = project.category.trim();
      if (!label) continue;
      const key = label.toLocaleLowerCase();
      counts.set(key, { label: counts.get(key)?.label ?? label, count: (counts.get(key)?.count ?? 0) + 1 });
    }
    return [...counts.entries()].map(([key, value]) => ({ key, ...value }));
  }, [projects]);

  const [active, setActive] = useState<string>("all");
  const visible = (project: ProjectFrontmatter) => active === "all" || project.category.trim().toLocaleLowerCase() === active;
  const visibleCount = projects.filter(visible).length;

  return (
    <div>
      <div className="work-index-toolbar">
        {categories.length > 1 ? (
          <div className="segmented" role="group" aria-label="Filter projects by category">
            <button type="button" aria-pressed={active === "all"} onClick={() => setActive("all")}>All<span>{projects.length}</span></button>
            {categories.map((category) => (
              <button key={category.key} type="button" aria-pressed={active === category.key} onClick={() => setActive(category.key)}>
                {category.label}<span>{category.count}</span>
              </button>
            ))}
          </div>
        ) : <span />}
        <span className="work-index-count" aria-live="polite">Showing {visibleCount} of {projects.length}</span>
      </div>

      <div className="work-grid">
        {projects.map((project, index) => {
          const href = `/projects/${project.slug}`;
          return (
            <article key={project.slug} className="work-card" data-hidden={!visible(project)}>
              <Link href={href} className="work-card-media" tabIndex={-1} aria-hidden="true">
                <TiltFrame>
                  <ProjectVisualPreview title={project.title} liveSiteUrl={project.liveSiteUrl} thumbnail={project.thumbnail} priority={index < 2} />
                </TiltFrame>
              </Link>
              <p className="work-meta">
                <span className="work-index">{String(index + 1).padStart(2, "0")}</span>
                <span>{project.category}</span>
                <span>{new Date(project.completionDate).getFullYear()}</span>
                {project.liveSiteUrl ? <span className="work-live"><i className="live-dot" /> Live</span> : null}
              </p>
              <h2><Link href={href}>{project.title}</Link></h2>
              <p>{project.summary}</p>
              {AI_ASSISTED_CATEGORY.test(project.category) ? <p className="ai-badge"><Sparkles size={13} aria-hidden="true" /> {aiAssistedNote.short}</p> : null}
              {project.technologies.length ? (
                <ul className="chip-list" aria-label="Built with">
                  {project.technologies.slice(0, 5).map((technology) => <li key={technology}>{technology}</li>)}
                </ul>
              ) : null}
              <div className="work-card-links">
                <Link href={href} className="btn btn-solid btn-sm">Details</Link>
                {project.liveSiteUrl ? <a href={project.liveSiteUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Live <ArrowUpRight size={14} /></a> : null}
                {project.githubUrl ? <a href={project.githubUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" aria-label={`${project.title} source code`}><Github size={14} /> Code</a> : null}
              </div>
            </article>
          );
        })}
      </div>

      {visibleCount === 0 ? <p className="muted">No projects in this category yet.</p> : null}
    </div>
  );
}
