import { siteConfig } from "@/lib/site-config";
import { getAllProjectSlugs, getAllLabSlugs, getAllArticleSlugs } from "@/lib/content";
import { getAllPublishedTags } from "@/lib/db/queries/tags";

export const dynamic = "force-dynamic";

const staticPaths = [
  "",
  "/about",
  "/projects",
  "/labs",
  "/journal",
  "/certifications",
  "/timeline",
  "/skills",
  "/resume",
  "/contact",
];

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const [projectSlugs, labSlugs, articleSlugs, tags] = await Promise.all([
    getAllProjectSlugs(),
    getAllLabSlugs(),
    getAllArticleSlugs(),
    getAllPublishedTags(),
  ]);
  const paths = [
    ...staticPaths,
    ...projectSlugs.map((slug) => `/projects/${slug}`),
    ...labSlugs.map((slug) => `/labs/${slug}`),
    ...articleSlugs.map((slug) => `/journal/${slug}`),
    ...tags.map(({ slug }) => `/tags/${slug}`),
  ];
  const lastModified = new Date().toISOString();
  const urls = paths
    .map(
      (path) =>
        `<url><loc>${escapeXml(`${siteConfig.siteUrl}${path}`)}</loc><lastmod>${lastModified}</lastmod></url>`
    )
    .join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
