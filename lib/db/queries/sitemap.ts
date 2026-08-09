import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { readWithPolicy } from "@/lib/db/read-policy";

export interface SitemapContentEntry {
  slug: string;
  updatedAt: Date;
}

export interface SitemapData {
  projects: SitemapContentEntry[];
  labs: SitemapContentEntry[];
  articles: SitemapContentEntry[];
  tagSlugs: string[];
  settingsUpdatedAt?: Date;
  certificationsUpdatedAt?: Date;
}

const fallback: SitemapData = {
  projects: [],
  labs: [],
  articles: [],
  tagSlugs: [],
};

export const getSitemapData = cache(async (): Promise<SitemapData> =>
  readWithPolicy("sitemap.getSitemapData", fallback, async () => {
    const [projects, labs, articles, tags, settings, latestCertificate] = await Promise.all([
      prisma.project.findMany({
        where: { publishStatus: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.lab.findMany({
        where: { publishStatus: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.article.findMany({
        where: { publishStatus: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.tag.findMany({
        where: {
          OR: [
            { projects: { some: { publishStatus: "PUBLISHED" } } },
            { labs: { some: { publishStatus: "PUBLISHED" } } },
            { articles: { some: { publishStatus: "PUBLISHED" } } },
          ],
        },
        select: {
          slug: true,
          _count: {
            select: {
              projects: { where: { publishStatus: "PUBLISHED" } },
              labs: { where: { publishStatus: "PUBLISHED" } },
              articles: { where: { publishStatus: "PUBLISHED" } },
            },
          },
        },
      }),
      prisma.siteSettings.findUnique({
        where: { id: "singleton" },
        select: { updatedAt: true },
      }),
      prisma.certificate.findFirst({
        where: { publishStatus: "PUBLISHED" },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
    ]);

    return {
      projects,
      labs,
      articles,
      tagSlugs: tags
        .filter(
          (tag) =>
            tag._count.projects + tag._count.labs + tag._count.articles >= 2,
        )
        .map((tag) => tag.slug),
      settingsUpdatedAt: settings?.updatedAt,
      certificationsUpdatedAt: latestCertificate?.updatedAt,
    };
  })
);
