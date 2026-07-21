import "server-only";
import { prisma } from "@/lib/db";
import { estimateReadingTime } from "@/lib/reading-time";
import type { ArticleFrontmatter, DbContentItem } from "@/types";
import type { TipTapDoc } from "@/types/tiptap";

interface ArticleWithRelations {
  title: string;
  slug: string;
  summary: string;
  content: unknown;
  category: { name: string } | null;
  tags: { name: string }[];
  date: Date;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function mapArticle(article: ArticleWithRelations): DbContentItem<ArticleFrontmatter> {
  const doc = article.content as unknown as TipTapDoc;

  const frontmatter: ArticleFrontmatter = {
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    date: toISODate(article.date),
    tags: article.tags.map((t) => t.name),
    category: article.category?.name ?? "Uncategorized",
  };

  return { frontmatter, content: doc, readingTime: estimateReadingTime(doc) };
}

export async function getArticleCount(): Promise<number> {
  try {
    return await prisma.article.count();
  } catch (error) {
    console.error("[queries/articles] getArticleCount failed:", error);
    return 0;
  }
}

export async function getAllArticles(): Promise<DbContentItem<ArticleFrontmatter>[]> {
  try {
    const articles = (await prisma.article.findMany({
      where: { publishStatus: "PUBLISHED" },
      include: { category: true, tags: true },
      orderBy: { date: "desc" },
    })) as ArticleWithRelations[];
    return articles.map(mapArticle);
  } catch (error) {
    console.error("[queries/articles] getAllArticles failed, returning empty list:", error);
    return [];
  }
}

export async function getArticleBySlug(
  slug: string
): Promise<DbContentItem<ArticleFrontmatter> | undefined> {
  try {
    const article = (await prisma.article.findFirst({
      where: { slug, publishStatus: "PUBLISHED" },
      include: { category: true, tags: true },
    })) as ArticleWithRelations | null;
    return article ? mapArticle(article) : undefined;
  } catch (error) {
    console.error(`[queries/articles] getArticleBySlug(${slug}) failed:`, error);
    return undefined;
  }
}

export async function getAllArticleSlugs(): Promise<string[]> {
  try {
    const articles = (await prisma.article.findMany({
      where: { publishStatus: "PUBLISHED" },
      select: { slug: true },
    })) as { slug: string }[];
    return articles.map((a) => a.slug);
  } catch (error) {
    console.error("[queries/articles] getAllArticleSlugs failed, returning empty list:", error);
    return [];
  }
}
