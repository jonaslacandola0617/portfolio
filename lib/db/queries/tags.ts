import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { readWithPolicy } from "@/lib/db/read-policy";

export interface PublishedTagSummary {
  name: string;
  slug: string;
  count: number;
}

export interface TaggedContentSummary {
  tag: { name: string; slug: string };
  projects: { title: string; slug: string }[];
  labs: { title: string; slug: string }[];
  articles: { title: string; slug: string }[];
}

export const getAllPublishedTags = cache(async (): Promise<PublishedTagSummary[]> =>
  readWithPolicy("tags.getAllPublishedTags", [], async () => {
    const tags = await prisma.tag.findMany({
      where: {
        OR: [
          { projects: { some: { publishStatus: "PUBLISHED" } } },
          { labs: { some: { publishStatus: "PUBLISHED" } } },
          { articles: { some: { publishStatus: "PUBLISHED" } } },
        ],
      },
      select: {
        name: true,
        slug: true,
        _count: {
          select: {
            projects: { where: { publishStatus: "PUBLISHED" } },
            labs: { where: { publishStatus: "PUBLISHED" } },
            articles: { where: { publishStatus: "PUBLISHED" } },
          },
        },
      },
    });

    return tags
      .map((tag) => ({
        name: tag.name,
        slug: tag.slug,
        count: tag._count.projects + tag._count.labs + tag._count.articles,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  })
);

export const getPublishedContentByTagSlug = cache(
  async (slug: string): Promise<TaggedContentSummary | undefined> =>
    readWithPolicy("tags.getPublishedContentByTagSlug", undefined, async () => {
      const tag = await prisma.tag.findUnique({
        where: { slug },
        select: {
          name: true,
          slug: true,
          projects: {
            where: { publishStatus: "PUBLISHED" },
            select: { title: true, slug: true },
            orderBy: { completionDate: "desc" },
          },
          labs: {
            where: { publishStatus: "PUBLISHED" },
            select: { title: true, slug: true },
            orderBy: { labDate: "desc" },
          },
          articles: {
            where: { publishStatus: "PUBLISHED" },
            select: { title: true, slug: true },
            orderBy: { date: "desc" },
          },
        },
      });
      return tag
        ? {
            tag: { name: tag.name, slug: tag.slug },
            projects: tag.projects,
            labs: tag.labs,
            articles: tag.articles,
          }
        : undefined;
    })
);
