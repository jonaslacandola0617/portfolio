import { PageHeader, PageShell } from "@/components/shared/page-header";
import { ProjectIndex } from "@/components/shared/project-index";
import { getAllProjects } from "@/lib/content";
import { buildStaticPageMetadata } from "@/lib/metadata";

export const metadata = buildStaticPageMetadata({
  title: "IT, Networking & Software Projects",
  description:
    "Explore web applications, APIs, software projects, networking labs, and cybersecurity work by Jonas Lacandola, documented with objectives, implementation details, evidence, and lessons learned.",
  path: "/projects",
  keywords: [
    "IT projects",
    "networking projects",
    "network configuration projects",
    "cybersecurity projects",
    "IT portfolio projects",
    "web application projects",
    "automation tools",
  ],
});

export default async function ProjectsPage() {
  const projects = await getAllProjects();
  return (
    <div>
      <PageHeader
        index="Projects"
        eyebrow={`${projects.length} projects`}
        title="Things I've built and run."
        description="Network builds, tools and web applications I've designed, deployed and maintained. Every entry is a case study: the problem, the decisions, and the result."
      />
      <PageShell>
        {projects.length ? (
          <ProjectIndex projects={projects.map((project) => project.frontmatter)} />
        ) : (
          <p className="text-sm text-text-dim">No published projects yet.</p>
        )}
      </PageShell>
    </div>
  );
}
