"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProjectVisualPreview } from "@/components/shared/project-visual-preview";
import type { ProjectFrontmatter } from "@/types";

export function ProjectIndex({ projects }: { projects: ProjectFrontmatter[] }) {
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const values: string[] = [];
    for (const project of projects) {
      const category = project.category.trim();
      if (!category) continue;
      const normalized = category.toLocaleLowerCase();
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      values.push(category);
    }
    return ["All", ...values];
  }, [projects]);

  const [active, setActive] = useState("All");
  const filtered = useMemo(
    () => active === "All" ? projects : projects.filter((project) => project.category.trim().toLocaleLowerCase() === active.trim().toLocaleLowerCase()),
    [active, projects],
  );

  return (
    <div className="project-index-system">
      <div className="project-index-filters" aria-label="Filter projects by category">
        <span>FILTER</span>
        {categories.map((category) => (
          <button key={category} type="button" onClick={() => setActive(category)} className={active === category ? "is-active" : ""}>
            {category}
          </button>
        ))}
      </div>

      <div className="project-index-list">
        {filtered.map((project, index) => (
          <Link key={project.slug} href={`/projects/${project.slug}`} className="project-index-row">
            <span className="project-index-number">{String(index + 1).padStart(2, "0")}</span>
            <div className="project-index-copy">
              <strong>{project.title}</strong>
              <p>{project.summary}</p>
            </div>
            <span className="project-index-category">{project.category}</span>
            <span className="project-index-year">{new Date(project.completionDate).getFullYear()}</span>
            <ArrowUpRight className="project-index-arrow" size={17} />
            <div className="project-index-preview" aria-hidden="true">
              <ProjectVisualPreview
                title={project.title}
                liveSiteUrl={project.liveSiteUrl}
                thumbnail={project.thumbnail}
              />
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? <p className="project-index-empty">No projects in this category yet.</p> : null}
    </div>
  );
}
