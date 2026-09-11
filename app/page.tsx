import { HomeHero } from "@/components/home/home-hero";
import { HomeSections } from "@/components/home/home-sections";
import { JsonLd } from "@/components/shared/json-ld";
import { siteConfig } from "@/lib/site-config";
import { getAllProjects, getAllArticles, getAllLabs } from "@/lib/content";
import { getAboutPage } from "@/lib/db/queries/about";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { buildStaticPageMetadata } from "@/lib/metadata";
import { buildWebsiteJsonLd } from "@/lib/structured-data";

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
  const [projects, articles, labs, settings, about] = await Promise.all([
    getAllProjects(),
    getAllArticles(),
    getAllLabs(),
    getSiteSettings(),
    getAboutPage(),
  ]);

  const previewProjects = projects.filter((project) => Boolean(project.frontmatter.liveSiteUrl || project.frontmatter.thumbnail));
  const automaticOrder = [
    ...previewProjects,
    ...projects.filter((project) => !previewProjects.some((preview) => preview.recordId === project.recordId)),
  ];

  const projectById = new Map(projects.map((project) => [project.recordId, project]));
  const configuredProjects = settings.homepageProjectIds.flatMap((id) => {
    const project = projectById.get(id);
    return project ? [project] : [];
  });

  // Preserve the old automatic pair only until the admin explicitly chooses
  // a showcase project. After that, the homepage reflects only the toggled
  // projects instead of silently filling an empty slot with a recent project.
  const explicitShowcase = settings.homepageProjectIds.length > 0;
  const primaryProject = explicitShowcase ? configuredProjects[0] : automaticOrder[0];
  const secondaryProject = explicitShowcase ? configuredProjects[1] : automaticOrder[1];

  const currentYear = new Date().getFullYear();
  const websiteJsonLd = buildWebsiteJsonLd({ name: settings.name, description: siteConfig.description });

  return (
    <div className="public-home">
      <JsonLd data={websiteJsonLd} />
      <HomeHero settings={settings} learningPhilosophy={about.learningPhilosophy} currentYear={currentYear} />
      <HomeSections
        primaryProject={primaryProject}
        secondaryProject={secondaryProject}
        featuredLab={labs[0]}
        articles={articles}
        settings={settings}
        currentYear={currentYear}
      />
    </div>
  );
}
