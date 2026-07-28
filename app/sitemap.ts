import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { getAllProjectSlugs, getAllLabSlugs, getAllArticleSlugs } from "@/lib/content";
import { getAllPublishedTags } from "@/lib/db/queries/tags";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.siteUrl;
  const staticRoutes = [
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
  ].map((route) => ({ url: `${base}${route}`, lastModified: new Date() }));

  const [projectSlugs, labSlugs, articleSlugs, tags] = await Promise.all([
    getAllProjectSlugs(),
    getAllLabSlugs(),
    getAllArticleSlugs(),
    getAllPublishedTags(),
  ]);

  const projectRoutes = projectSlugs.map((slug) => ({
    url: `${base}/projects/${slug}`,
    lastModified: new Date(),
  }));
  const labRoutes = labSlugs.map((slug) => ({
    url: `${base}/labs/${slug}`,
    lastModified: new Date(),
  }));
  const articleRoutes = articleSlugs.map((slug) => ({
    url: `${base}/journal/${slug}`,
    lastModified: new Date(),
  }));
  const tagRoutes = tags.map(({ slug }) => ({
    url: `${base}/tags/${slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...projectRoutes, ...labRoutes, ...articleRoutes, ...tagRoutes];
}
