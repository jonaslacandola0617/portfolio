import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { slugify } from "@/lib/utils";
import type { TimelineFormValues } from "@/lib/validations/timeline";
import { revalidateContent } from "@/lib/services/content-revalidation";

interface AdminTimelineListItem {
  id: string;
  title: string;
  date: Date;
  publishStatus: string;
  category: string;
}

interface AdminTimelineDetail {
  id: string;
  title: string;
  description: string;
  date: Date;
  category: string;
  publishStatus: string;
  tags: { name: string }[];
  scheduledFor: Date | null;
}

function tagsInput(fm: TimelineFormValues) {
  return {
    connectOrCreate: fm.tags.map((tag) => ({
      where: { slug: slugify(tag) },
      create: { name: tag, slug: slugify(tag) },
    })),
  };
}

export async function getAllTimelineForAdmin(): Promise<AdminTimelineListItem[]> {
  return prisma.timelineEntry.findMany({ orderBy: { date: "desc" } }) as Promise<
    AdminTimelineListItem[]
  >;
}

export async function getTimelineEntryForEdit(id: string): Promise<AdminTimelineDetail | null> {
  return prisma.timelineEntry.findUnique({
    where: { id },
    include: { tags: true },
  }) as Promise<AdminTimelineDetail | null>;
}

export async function createTimelineEntry(fm: TimelineFormValues) {
  const entry = await prisma.timelineEntry.create({
    data: {
      title: fm.title,
      description: fm.description,
      date: new Date(fm.date),
      category: fm.category,
      publishStatus: fm.publishStatus,
      scheduledFor: fm.scheduledFor ? new Date(fm.scheduledFor) : null,
      publishedAt: fm.publishStatus === "PUBLISHED" ? new Date() : null,
      tags: tagsInput(fm),
    },
  });
  revalidateContent("timeline");
  return entry;
}

export async function updateTimelineEntry(id: string, fm: TimelineFormValues) {
  const existing = await prisma.timelineEntry.findUnique({ where: { id }, select: { publishStatus: true } });

  const entry = await prisma.timelineEntry.update({
    where: { id },
    data: {
      title: fm.title,
      description: fm.description,
      date: new Date(fm.date),
      category: fm.category,
      publishStatus: fm.publishStatus,
      scheduledFor: fm.scheduledFor ? new Date(fm.scheduledFor) : null,
      ...(fm.publishStatus === "PUBLISHED" && existing?.publishStatus !== "PUBLISHED"
        ? { publishedAt: new Date() }
        : {}),
      tags: { set: [], ...tagsInput(fm) },
    },
  });
  revalidateContent("timeline");
  return entry;
}

export async function deleteTimelineEntry(id: string) {
  await prisma.timelineEntry.delete({ where: { id } });
  revalidateContent("timeline");
}

/** Bulk delete for the management page's checkbox selection. */
export async function deleteTimelineEntries(ids: string[]): Promise<number> {
  const count = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const records = await tx.timelineEntry.findMany({ where: { id: { in: ids } }, select: { id: true } });
    await tx.timelineEntry.deleteMany({ where: { id: { in: ids } } });
    return records.length;
  });

  revalidateContent("timeline");
  return count;
}
