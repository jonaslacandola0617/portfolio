import { PageHeader, PageShell } from "@/components/shared/page-header";
import { ProjectIndex } from "@/components/shared/project-index";
import { getAllProjects } from "@/lib/content";
import { buildStaticPageMetadata } from "@/lib/metadata";

export const metadata = buildStaticPageMetadata({
  title: "Cybersecurity & Networking Projects",
  description:
    "Explore hands-on networking, cybersecurity, and software projects by Jonas Lacandola, documented with objectives, implementation details, evidence, and lessons learned.",
  path: "/projects",
  keywords: [
    "cybersecurity projects",
    "networking projects",
    "CCNA portfolio",
    "Packet Tracer projects",
    "IT portfolio projects",
  ],
});

export default async function ProjectsPage() {
  const projects = await getAllProjects();
  return (
    <div>
      <PageHeader
        index="02"
        eyebrow="Index"
        title="Projects"
        description="Applied work across networking, security, and software — each entry documented as a self-contained case study: objective, process, and evidence."
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
