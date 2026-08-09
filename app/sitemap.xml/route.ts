import { siteConfig } from "@/lib/site-config";
import { getSitemapData } from "@/lib/db/queries/sitemap";

export const dynamic = "force-dynamic";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function latestDate(...dates: Array<Date | undefined>) {
  const valid = dates.filter((date): date is Date => Boolean(date));
  if (!valid.length) return undefined;
  return new Date(Math.max(...valid.map((date) => date.getTime())));
}

function newestEntry(entries: { updatedAt: Date }[]) {
  return latestDate(...entries.map((entry) => entry.updatedAt));
}

function xmlUrl(path: string, lastModified?: Date) {
  const location = escapeXml(`${siteConfig.siteUrl}${path}`);
  const lastmod = lastModified
    ? `<lastmod>${lastModified.toISOString()}</lastmod>`
    : "";
  return `<url><loc>${location}</loc>${lastmod}</url>`;
}

export async function GET() {
  const data = await getSitemapData();
  const latestProject = newestEntry(data.projects);
  const latestLab = newestEntry(data.labs);
  const latestArticle = newestEntry(data.articles);
  const latestSiteChange = latestDate(
    data.settingsUpdatedAt,
    data.certificationsUpdatedAt,
    latestProject,
    latestLab,
    latestArticle,
  );

  const urls = [
    xmlUrl("", latestSiteChange),
    xmlUrl("/about", data.settingsUpdatedAt),
    xmlUrl("/projects", latestProject),
    xmlUrl("/labs", latestLab),
    xmlUrl("/journal", latestArticle),
    xmlUrl("/certifications", data.certificationsUpdatedAt),
    xmlUrl("/resume", data.settingsUpdatedAt),
    xmlUrl("/contact", data.settingsUpdatedAt),
    ...data.projects.map((entry) =>
      xmlUrl(`/projects/${entry.slug}`, entry.updatedAt),
    ),
    ...data.labs.map((entry) => xmlUrl(`/labs/${entry.slug}`, entry.updatedAt)),
    ...data.articles.map((entry) =>
      xmlUrl(`/journal/${entry.slug}`, entry.updatedAt),
    ),
    ...data.tagSlugs.map((slug) => xmlUrl(`/tags/${slug}`)),
  ].join("");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Content-Type": "application/xml; charset=utf-8",
      },
    },
  );
}
