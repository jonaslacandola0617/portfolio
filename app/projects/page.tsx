import { PageHeader, PageShell } from "@/components/shared/page-header";
import { ProjectIndex } from "@/components/shared/project-index";
import { getAllProjects } from "@/lib/content";
import { buildStaticPageMetadata } from "@/lib/metadata";

export const metadata = buildStaticPageMetadata({
  title: "Web Development, IT & Networking Projects",
  description:
    "Explore web applications, APIs, software projects, networking labs, and cybersecurity work by Jonas Lacandola, documented with objectives, implementation details, evidence, and lessons learned.",
  path: "/projects",
  keywords: [
    "web development projects",
    "Laravel projects",
    "PHP projects",
    "React projects",
    "Next.js projects",
    "full stack projects",
    "API projects",
    "IT portfolio projects",
    "networking projects",
    "cybersecurity projects",
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
        description="Applied work across web development, IT, networking, and security — each entry documented as a self-contained case study: objective, process, and evidence."
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
