import { HomeHero } from "@/components/home/home-hero";
import { HomeSections } from "@/components/home/home-sections";
import { JsonLd } from "@/components/shared/json-ld";
import { siteConfig } from "@/lib/site-config";
import { getAllProjects, getAllArticles, getAllLabs } from "@/lib/content";
import { getAllCertificates } from "@/lib/db/queries/certificates";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { buildStaticPageMetadata } from "@/lib/metadata";
import { buildWebsiteJsonLd } from "@/lib/structured-data";

const FEATURED_LIMIT = 4;

export async function generateMetadata() {
  const settings = await getSiteSettings();
  return buildStaticPageMetadata({
    title: `${settings.name} — ${settings.role}`,
    description: siteConfig.description,
    path: "/",
    keywords: [
      settings.name,
      "web developer portfolio",
      "Laravel developer",
      "PHP developer",
      "React developer",
      "Next.js developer",
      "TypeScript developer",
      "full stack web development",
      "IT support portfolio",
      "technical support",
      "networking portfolio",
      "cybersecurity portfolio",
    ],
  });
}

export default async function HomePage() {
  const [projects, articles, labs, settings, certificates] = await Promise.all([
    getAllProjects(),
    getAllArticles(),
    getAllLabs(),
    getSiteSettings(),
    getAllCertificates(),
  ]);

  // CMS-selected showcase first, then the most recent live products, then the rest.
  const projectById = new Map(projects.map((project) => [project.recordId, project]));
  const pinned = settings.homepageProjectIds
    .map((id) => projectById.get(id))
    .filter((project) => project !== undefined);
  const pinnedIds = new Set(pinned.map((project) => project.recordId));
  const remaining = projects
    .filter((project) => !pinnedIds.has(project.recordId))
    .sort((a, b) => Number(Boolean(b.frontmatter.liveSiteUrl)) - Number(Boolean(a.frontmatter.liveSiteUrl)));
  const featured = [...pinned, ...remaining].slice(0, FEATURED_LIMIT);

  const stats = {
    live: projects.filter((project) => project.frontmatter.liveSiteUrl).length,
    projects: projects.length,
    labs: labs.length,
    certifications: certificates.length,
  };

  const websiteJsonLd = buildWebsiteJsonLd({ name: settings.name, description: siteConfig.description });

  return (
    <div className="home">
      <JsonLd data={websiteJsonLd} />
      <HomeHero settings={settings} stats={stats} />
      <HomeSections
        featured={featured}
        projects={projects}
        labs={labs}
        articles={articles}
        settings={settings}
        certificationCount={certificates.length}
      />
    </div>
  );
}
