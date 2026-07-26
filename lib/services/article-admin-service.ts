import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { ArticleFormValues } from "@/lib/validations/article";
import type { JSONContent } from "@tiptap/react";

import { articleTemplate } from "@/lib/editor/templates";
import { toPrismaJson } from "@/lib/prisma-json";

interface AdminArticleListItem {
  id: string;
  title: string;
  slug: string;
  publishStatus: string;
  updatedAt: Date;
}

interface AdminArticleDetail {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: unknown;
  publishStatus: string;
  category: { name: string } | null;
  tags: { name: string }[];
  date: Date;
  scheduledFor: Date | null;
}

function relationInput(fm: ArticleFormValues) {
  return {
    category: {
      connectOrCreate: {
        where: { slug: slugify(fm.category) },
        create: { name: fm.category, slug: slugify(fm.category) },
      },
    },
    tags: {
      connectOrCreate: fm.tags.map((tag) => ({
        where: { slug: slugify(tag) },
        create: { name: tag, slug: slugify(tag) },
      })),
    },
  };
}

export async function getAllArticlesForAdmin(): Promise<AdminArticleListItem[]> {
  return prisma.article.findMany({
    include: { category: true, tags: true },
    orderBy: { updatedAt: "desc" },
  }) as Promise<AdminArticleListItem[]>;
}

export async function getArticleForEdit(id: string): Promise<AdminArticleDetail | null> {
  return prisma.article.findUnique({
    where: { id },
    include: { category: true, tags: true },
  }) as Promise<AdminArticleDetail | null>;
}

export async function createArticle(fm: ArticleFormValues) {
  const article = await prisma.article.create({
    data: {
      title: fm.title,
      slug: fm.slug,
      summary: fm.summary,
      publishStatus: fm.publishStatus,
      date: new Date(fm.date),
      scheduledFor: fm.scheduledFor ? new Date(fm.scheduledFor) : null,
      publishedAt: fm.publishStatus === "PUBLISHED" ? new Date() : null,
      content: toPrismaJson(articleTemplate),
      ...relationInput(fm),
    },
  });
  await revalidateArticlePaths(article.slug);
  return article;
}

export async function updateArticleMetadata(id: string, fm: ArticleFormValues) {
  const existing = await prisma.article.findUnique({ where: { id }, select: { slug: true, publishStatus: true } });

  const article = await prisma.article.update({
    where: { id },
    data: {
      title: fm.title,
      slug: fm.slug,
      summary: fm.summary,
      publishStatus: fm.publishStatus,
      date: new Date(fm.date),
      scheduledFor: fm.scheduledFor ? new Date(fm.scheduledFor) : null,
      ...(fm.publishStatus === "PUBLISHED" && existing?.publishStatus !== "PUBLISHED"
        ? { publishedAt: new Date() }
        : {}),
      category: relationInput(fm).category,
      tags: { set: [], ...relationInput(fm).tags },
    },
  });

  await revalidateArticlePaths(article.slug);
  if (existing && existing.slug !== article.slug) await revalidateArticlePaths(existing.slug);
  return article;
}

export async function updateArticleContent(id: string, content: JSONContent) {
  const article = await prisma.article.update({
    where: { id },
    data: { content: toPrismaJson(content) },
    select: { slug: true, publishStatus: true },
  });
  if (article.publishStatus === "PUBLISHED") await revalidateArticlePaths(article.slug);
}

export async function deleteArticle(id: string) {
  const article = await prisma.article.delete({ where: { id }, select: { slug: true } });
  await revalidateArticlePaths(article.slug);
}

async function revalidateArticlePaths(slug: string) {
  revalidatePath("/journal");
  revalidatePath(`/journal/${slug}`);
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
}
