import { HomeHero } from "@/components/home/home-hero";
import { HomeSections } from "@/components/home/home-sections";
import { JsonLd } from "@/components/shared/json-ld";
import { siteConfig } from "@/lib/site-config";
import { getAllProjects, getAllArticles, getAllLabs } from "@/lib/content";
import { getAboutPage } from "@/lib/db/queries/about";
import { getAllCertificates } from "@/lib/db/queries/certificates";
import { getHomepageContent } from "@/lib/db/queries/homepage";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { buildStaticPageMetadata } from "@/lib/metadata";
import { buildPersonJsonLd, buildWebsiteJsonLd } from "@/lib/structured-data";

const FEATURED_LIMIT = 2;

export async function generateMetadata() {
  const settings = await getSiteSettings();
  return buildStaticPageMetadata({
    title: `${settings.name} — ${settings.role}`,
    description: siteConfig.description,
    path: "/",
    keywords: [
      settings.name,
      "IT support portfolio",
      "IT help desk",
      "desktop support",
      "network technician",
      "cybersecurity portfolio",
      "SOC analyst portfolio",
      "technical support",
      "help desk",
      "CCNA",
      "Cisco networking labs",
      "Linux",
      "IT Philippines",
    ],
  });
}

export default async function HomePage() {
  const [projects, articles, labs, settings, certificates, about, content] = await Promise.all([
    getAllProjects(),
    getAllArticles(),
    getAllLabs(),
    getSiteSettings(),
    getAllCertificates(),
    getAboutPage(),
    getHomepageContent(),
  ]);

  // Projects are the supporting act: CMS-selected showcase first, then live tools.
  const projectById = new Map(projects.map((project) => [project.recordId, project]));
  const pinned = settings.homepageProjectIds
    .map((id) => projectById.get(id))
    .filter((project) => project !== undefined);
  const pinnedIds = new Set(pinned.map((project) => project.recordId));
  const remaining = projects
    .filter((project) => !pinnedIds.has(project.recordId))
    .sort((a, b) => Number(Boolean(b.frontmatter.liveSiteUrl)) - Number(Boolean(a.frontmatter.liveSiteUrl)));
  const featured = [...pinned, ...remaining].slice(0, FEATURED_LIMIT);

  // IT, networking and security credentials first; general web-development courses after.
  const isWebCourse = (issuer: string, name: string) => /udemy/i.test(issuer) || /react|node\.?js|express|javascript/i.test(name);
  const itFirst = [...certificates].sort(
    (a, b) => Number(isWebCourse(a.issuer, a.name)) - Number(isWebCourse(b.issuer, b.name)),
  );

  const websiteJsonLd = buildWebsiteJsonLd({ name: settings.name, description: siteConfig.description });
  const personJsonLd = buildPersonJsonLd({
    name: settings.name,
    role: settings.role,
    description: settings.tagline,
    githubUrl: settings.githubUrl,
    linkedinUrl: settings.linkedinUrl,
    profileImageUrl: about.profileImageUrl,
    knowsAbout: [...about.focusTags, ...content.experience.flatMap((entry) => entry.skills), ...certificates.flatMap((cert) => cert.skills)],
    credentials: itFirst.map((cert) => ({ name: cert.name, issuer: cert.issuer, url: cert.credentialUrl, dateCompleted: cert.dateCompleted })),
  });

  return (
    <div className="home">
      <JsonLd data={websiteJsonLd} />
      <JsonLd data={personJsonLd} />
      <HomeHero settings={settings} content={content} certificationCount={certificates.length} profileImageUrl={about.profileImageUrl} />
      <HomeSections
        content={content}
        featuredProjects={featured}
        projects={projects}
        labs={labs}
        certificates={itFirst}
        articles={articles}
      />
    </div>
  );
}
