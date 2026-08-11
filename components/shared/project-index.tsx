"use client";

import { useMemo, useState } from "react";
import { ProjectCard } from "@/components/shared/project-card";
import type { ProjectFrontmatter } from "@/types";

export function ProjectIndex({ projects }: { projects: ProjectFrontmatter[] }) {
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const projectCategories: string[] = [];

    for (const project of projects) {
      const category = project.category.trim();
      if (!category) continue;

      const normalized = category.toLocaleLowerCase();
      if (seen.has(normalized)) continue;

      seen.add(normalized);
      projectCategories.push(category);
    }

    return ["All", ...projectCategories];
  }, [projects]);

  const [active, setActive] = useState("All");

  const filtered = useMemo(
    () =>
      active === "All"
        ? projects
        : projects.filter(
            (project) =>
              project.category.trim().toLocaleLowerCase() ===
              active.trim().toLocaleLowerCase(),
          ),
    [active, projects],
  );

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-2 border-b border-border pb-8">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActive(category)}
            className={`label border px-3 py-1.5 transition-colors ${
              active === category
                ? "border-border-strong bg-text text-surface"
                : "border-border text-text-dim hover:border-border-strong"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {filtered.map((project, index) => (
          <ProjectCard
            key={project.slug}
            project={project}
            index={index + 1}
            size="regular"
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-text-dim">
          No projects in this category yet.
        </p>
      )}
    </>
  );
}
