import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { slugify } from "@/lib/utils";
import type { ArticleFormValues } from "@/lib/validations/article";
import type { TipTapDoc } from "@/types/tiptap";

import { getTemplateDocument } from "@/lib/editor/templates";
import { toPrismaJson } from "@/lib/prisma-json";
import { revalidateContent } from "@/lib/services/content-revalidation";

interface AdminArticleListItem {
  id: string;
  title: string;
  slug: string;
  publishStatus: string;
  updatedAt: Date;
  category: { name: string } | null;
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
  downloads: {
    id: string;
    label: string;
    description: string | null;
    sortOrder: number;
    mediaId: string | null;
    media: { id: string; url: string; filename: string; type: string; size: number } | null;
  }[];
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
    include: {
      category: true,
      tags: true,
      downloads: {
        include: { media: true },
        orderBy: { sortOrder: "asc" },
      },
    },
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
      content: toPrismaJson(getTemplateDocument(fm.templateId, "article")),
      ...relationInput(fm),
    },
  });
  revalidateContent("article", [article.slug]);
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

  revalidateContent("article", existing ? [existing.slug, article.slug] : [article.slug]);
  return article;
}

export async function updateArticleContent(id: string, content: TipTapDoc) {
  const article = await prisma.article.update({
    where: { id },
    data: { content: toPrismaJson(content) },
    select: { slug: true, publishStatus: true },
  });
  if (article.publishStatus === "PUBLISHED") revalidateContent("article", [article.slug]);
  const readBack = await prisma.article.findUnique({ where: { id }, select: { content: true } });
  return readBack?.content;
}

export async function updateArticleResources(
  articleId: string,
  resources: Array<{ mediaId: string; label: string; description: string; sortOrder: number }>
) {
  const article = await prisma.article.findUnique({ where: { id: articleId }, select: { slug: true } });
  if (!article) throw new Error("Journal entry not found");

  const ids = [...new Set(resources.map((resource) => resource.mediaId))];
  const media = await prisma.media.findMany({
    where: { id: { in: ids }, type: { not: "IMAGE" } },
    select: { id: true, url: true, type: true },
  });
  if (media.length !== ids.length) throw new Error("One or more selected resources are invalid.");

  const byId = new Map(media.map((item) => [item.id, item]));
  await prisma.$transaction(async (tx) => {
    await tx.download.deleteMany({ where: { articleId } });
    if (resources.length) {
      await tx.download.createMany({
        data: resources.map((resource) => {
          const item = byId.get(resource.mediaId)!;
          const type =
            item.type === "PACKET_TRACER" ? "packet-tracer" :
            item.type === "PCAP" ? "pcap" :
            item.type === "PDF" ? "pdf" :
            item.type === "ZIP" ? "zip" :
            item.type === "OTHER" ? "config" : "other";
          return {
            articleId,
            mediaId: item.id,
            label: resource.label,
            description: resource.description || null,
            sortOrder: resource.sortOrder,
            url: item.url,
            type,
          };
        }),
      });
    }
  });

  revalidateContent("article", [article.slug]);
}

export async function deleteArticle(id: string) {
  const article = await prisma.article.delete({ where: { id }, select: { slug: true } });
  revalidateContent("article", [article.slug]);
}

/** Bulk delete for the management page's checkbox selection — same
 *  transaction-then-revalidate pattern as
 *  lib/services/project-admin-service.ts's deleteProjects(). */
export async function deleteArticles(ids: string[]): Promise<number> {
  const slugs = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const records = await tx.article.findMany({ where: { id: { in: ids } }, select: { slug: true } });
    await tx.article.deleteMany({ where: { id: { in: ids } } });
    return records.map((r: { slug: string }) => r.slug);
  });

  revalidateContent("article", slugs);

  return slugs.length;
}
