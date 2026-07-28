import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { slugify } from "@/lib/utils";
import type { LabFormValues } from "@/lib/validations/lab";
import type { TipTapDoc } from "@/types/tiptap";

import { labTemplate } from "@/lib/editor/templates";
import { toPrismaJson } from "@/lib/prisma-json";

/** Same pattern as lib/services/project-admin-service.ts — see that
 *  file's comments for the reasoning behind hand-rolled types,
 *  connectOrCreate relation handling, and the publishedAt-stamping rule. */
interface AdminLabListItem {
  id: string;
  title: string;
  slug: string;
  publishStatus: string;
  updatedAt: Date;
}

interface AdminLabDetail {
  id: string;
  title: string;
  slug: string;
  purpose: string;
  content: unknown;
  difficulty: string;
  progressStatus: string;
  publishStatus: string;
  category: { name: string } | null;
  tags: { name: string }[];
  labDate: Date;
  scheduledFor: Date | null;
}

function relationInput(fm: LabFormValues) {
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

export async function getAllLabsForAdmin(): Promise<AdminLabListItem[]> {
  return prisma.lab.findMany({
    include: { category: true, tags: true },
    orderBy: { updatedAt: "desc" },
  }) as Promise<AdminLabListItem[]>;
}

export async function getLabForEdit(id: string): Promise<AdminLabDetail | null> {
  return prisma.lab.findUnique({
    where: { id },
    include: { category: true, tags: true },
  }) as Promise<AdminLabDetail | null>;
}

export async function createLab(fm: LabFormValues) {
  const lab = await prisma.lab.create({
    data: {
      title: fm.title,
      slug: fm.slug,
      purpose: fm.purpose,
      difficulty: fm.difficulty,
      progressStatus: fm.progressStatus,
      publishStatus: fm.publishStatus,
      labDate: new Date(fm.labDate),
      scheduledFor: fm.scheduledFor ? new Date(fm.scheduledFor) : null,
      publishedAt: fm.publishStatus === "PUBLISHED" ? new Date() : null,
      content: toPrismaJson(labTemplate),
      ...relationInput(fm),
    },
  });
  await revalidateLabPaths(lab.slug);
  return lab;
}

export async function updateLabMetadata(id: string, fm: LabFormValues) {
  const existing = await prisma.lab.findUnique({ where: { id }, select: { slug: true, publishStatus: true } });

  const lab = await prisma.lab.update({
    where: { id },
    data: {
      title: fm.title,
      slug: fm.slug,
      purpose: fm.purpose,
      difficulty: fm.difficulty,
      progressStatus: fm.progressStatus,
      publishStatus: fm.publishStatus,
      labDate: new Date(fm.labDate),
      scheduledFor: fm.scheduledFor ? new Date(fm.scheduledFor) : null,
      ...(fm.publishStatus === "PUBLISHED" && existing?.publishStatus !== "PUBLISHED"
        ? { publishedAt: new Date() }
        : {}),
      category: relationInput(fm).category,
      tags: { set: [], ...relationInput(fm).tags },
    },
  });

  await revalidateLabPaths(lab.slug);
  if (existing && existing.slug !== lab.slug) await revalidateLabPaths(existing.slug);
  return lab;
}

export async function updateLabContent(id: string, content: TipTapDoc) {
  const lab = await prisma.lab.update({
    where: { id },
    data: { content: toPrismaJson(content) },
    select: { slug: true, publishStatus: true },
  });
  if (lab.publishStatus === "PUBLISHED") await revalidateLabPaths(lab.slug);
  const readBack = await prisma.lab.findUnique({ where: { id }, select: { content: true } });
  return readBack?.content;
}

export async function deleteLab(id: string) {
  const lab = await prisma.lab.delete({ where: { id }, select: { slug: true } });
  await revalidateLabPaths(lab.slug);
}

/** Bulk delete for the management page's checkbox selection — same
 *  transaction-then-revalidate pattern as
 *  lib/services/project-admin-service.ts's deleteProjects(). */
export async function deleteLabs(ids: string[]): Promise<number> {
  const slugs = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const records = await tx.lab.findMany({ where: { id: { in: ids } }, select: { slug: true } });
    await tx.lab.deleteMany({ where: { id: { in: ids } } });
    return records.map((r: { slug: string }) => r.slug);
  });

  for (const slug of slugs) {
    revalidatePath(`/labs/${slug}`);
  }
  revalidatePath("/labs");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");

  return slugs.length;
}

async function revalidateLabPaths(slug: string) {
  revalidatePath("/labs");
  revalidatePath(`/labs/${slug}`);
  revalidatePath("/tags/[tag]", "page");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
}
