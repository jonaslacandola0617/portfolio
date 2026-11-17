import { PageHeader, PageShell } from "@/components/shared/page-header";
import { ProjectIndex } from "@/components/shared/project-index";
import { getAllProjects } from "@/lib/content";
import { getHomepageContent } from "@/lib/db/queries/homepage";
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
  const [projects, content] = await Promise.all([getAllProjects(), getHomepageContent()]);
  const anyAiAssisted = projects.some((project) => project.frontmatter.aiAssisted);
  return (
    <div>
      <PageHeader
        index="Projects"
        eyebrow={`${projects.length} projects`}
        title="Things I've set up and shipped."
        description={anyAiAssisted ? content.aiNote.long : "Projects I've set up, deployed and kept running."}
      />
      <PageShell>
        {projects.length ? (
          <ProjectIndex projects={projects.map((project) => project.frontmatter)} aiBadge={content.aiNote.short} />
        ) : (
          <p className="text-sm text-text-dim">No published projects yet.</p>
        )}
      </PageShell>
    </div>
  );
}
