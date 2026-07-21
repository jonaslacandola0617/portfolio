import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectCard } from "@/components/shared/project-card";
import { getAllProjects } from "@/lib/content";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const projects = await getAllProjects();

  return (
    <div className="mx-auto max-w-6xl px-6 py-14 md:px-10">
      <PageHeader
        eyebrow="Projects"
        title="Hands-on builds"
        description="Curated, end-to-end projects — each one documents objectives, configuration, verification, and what went wrong along the way."
      />

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No published projects yet.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.frontmatter.slug} project={p.frontmatter} />
          ))}
        </div>
      )}
    </div>
  );
}
