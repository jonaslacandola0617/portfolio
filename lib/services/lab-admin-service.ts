import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { slugify } from "@/lib/utils";
import type { LabFormValues } from "@/lib/validations/lab";
import type { TipTapDoc } from "@/types/tiptap";

import { getTemplateDocument } from "@/lib/editor/templates";
import { toPrismaJson } from "@/lib/prisma-json";
import { revalidateContent } from "@/lib/services/content-revalidation";

/** Same pattern as lib/services/project-admin-service.ts — see that
 *  file's comments for the reasoning behind hand-rolled types,
 *  connectOrCreate relation handling, and the publishedAt-stamping rule. */
interface AdminLabListItem {
  id: string;
  title: string;
  slug: string;
  publishStatus: string;
  updatedAt: Date;
  category: { name: string } | null;
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
  downloads: {
    id: string;
    label: string;
    description: string | null;
    sortOrder: number;
    mediaId: string | null;
    media: { id: string; url: string; filename: string; type: string; size: number } | null;
  }[];
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
    include: {
      category: true,
      tags: true,
      downloads: { include: { media: true }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  }) as Promise<AdminLabListItem[]>;
}

export async function getLabForEdit(id: string): Promise<AdminLabDetail | null> {
  return prisma.lab.findUnique({
    where: { id },
    include: {
      category: true,
      tags: true,
      downloads: {
        include: { media: true },
        orderBy: { sortOrder: "asc" },
      },
    },
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
      content: toPrismaJson(getTemplateDocument(fm.templateId, "lab")),
      ...relationInput(fm),
    },
  });
  revalidateContent("lab", [lab.slug]);
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

  revalidateContent("lab", existing ? [existing.slug, lab.slug] : [lab.slug]);
  return lab;
}

export async function updateLabContent(id: string, content: TipTapDoc) {
  const lab = await prisma.lab.update({
    where: { id },
    data: { content: toPrismaJson(content) },
    select: { slug: true, publishStatus: true },
  });
  if (lab.publishStatus === "PUBLISHED") revalidateContent("lab", [lab.slug]);
  const readBack = await prisma.lab.findUnique({ where: { id }, select: { content: true } });
  return readBack?.content;
}

export async function updateLabResources(
  labId: string,
  resources: Array<{ mediaId: string; label: string; description: string; sortOrder: number }>
) {
  const lab = await prisma.lab.findUnique({ where: { id: labId }, select: { slug: true } });
  if (!lab) throw new Error("Lab not found");
  const ids = [...new Set(resources.map((resource) => resource.mediaId))];
  const media = await prisma.media.findMany({
    where: { id: { in: ids }, type: { not: "IMAGE" } },
    select: { id: true, url: true, type: true },
  });
  if (media.length !== ids.length) throw new Error("One or more selected resources are invalid.");
  const byId = new Map(media.map((item) => [item.id, item]));
  await prisma.$transaction(async (tx) => {
    await tx.download.deleteMany({ where: { labId } });
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
            labId,
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
  revalidateContent("lab", [lab.slug]);
}

export async function deleteLab(id: string) {
  const lab = await prisma.lab.delete({ where: { id }, select: { slug: true } });
  revalidateContent("lab", [lab.slug]);
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

  revalidateContent("lab", slugs);

  return slugs.length;
}
