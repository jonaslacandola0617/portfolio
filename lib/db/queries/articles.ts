import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { readWithPolicy } from "@/lib/db/read-policy";
import { estimateReadingTime } from "@/lib/reading-time";
import type { ArticleFrontmatter, DbContentItem, DownloadLink } from "@/types";
import type { TipTapDoc } from "@/types/tiptap";

interface ArticleWithRelations {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: unknown;
  category: { name: string } | null;
  tags: { name: string }[];
  date: Date;
  updatedAt: Date;
  downloads: {
    label: string;
    url: string;
    type: string;
    description: string | null;
    media: { size: number } | null;
  }[];
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function mapArticle(article: ArticleWithRelations): DbContentItem<ArticleFrontmatter> {
  const doc = article.content as TipTapDoc;
  return {
    recordId: article.id,
    frontmatter: {
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      date: toISODate(article.date),
      lastUpdated: article.updatedAt.toISOString(),
      tags: article.tags.map((tag) => tag.name),
      category: article.category?.name ?? "Uncategorized",
      downloads: article.downloads.map((download): DownloadLink => ({
        label: download.label,
        href: download.url,
        type: download.type as DownloadLink["type"],
        description: download.description ?? undefined,
        size: download.media?.size,
      })),
    },
    content: doc,
    readingTime: estimateReadingTime(doc),
  };
}

export const getArticleCount = cache(async (): Promise<number> =>
  readWithPolicy("articles.getArticleCount", 0, () => prisma.article.count())
);

export const getAllArticles = cache(async (): Promise<DbContentItem<ArticleFrontmatter>[]> =>
  readWithPolicy("articles.getAllArticles", [], async () => {
    const articles = (await prisma.article.findMany({
      where: { publishStatus: "PUBLISHED" },
      include: {
        category: true,
        tags: true,
        downloads: { include: { media: true }, orderBy: { sortOrder: "asc" } },
      },
      orderBy: { date: "desc" },
    })) as ArticleWithRelations[];
    return articles.map(mapArticle);
  })
);

export const getArticleBySlug = cache(
  async (slug: string): Promise<DbContentItem<ArticleFrontmatter> | undefined> =>
    readWithPolicy(`articles.getArticleBySlug(${slug})`, undefined, async () => {
      const article = (await prisma.article.findFirst({
        where: { slug, publishStatus: "PUBLISHED" },
        include: {
          category: true,
          tags: true,
          downloads: { include: { media: true }, orderBy: { sortOrder: "asc" } },
        },
      })) as ArticleWithRelations | null;
      return article ? mapArticle(article) : undefined;
    })
);

export const getAllArticleSlugs = cache(async (): Promise<string[]> =>
  readWithPolicy("articles.getAllArticleSlugs", [], async () => {
    const articles = await prisma.article.findMany({
      where: { publishStatus: "PUBLISHED" },
      select: { slug: true },
    });
    return articles.map((article) => article.slug);
  })
);
