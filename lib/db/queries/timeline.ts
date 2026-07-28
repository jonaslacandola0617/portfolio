import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { readWithPolicy } from "@/lib/db/read-policy";
import type { TimelineEntry } from "@/types";

interface TimelineEntryRow {
  id: string;
  date: Date;
  title: string;
  description: string;
  category: string;
  tags: { name: string }[];
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const getAllTimelineEntries = cache(async (): Promise<TimelineEntry[]> =>
  readWithPolicy("timeline.getAllTimelineEntries", [], async () => {
    const entries = (await prisma.timelineEntry.findMany({
      where: { publishStatus: "PUBLISHED" },
      include: { tags: true },
      orderBy: { date: "desc" },
    })) as TimelineEntryRow[];
    return entries.map((entry) => ({
      id: entry.id,
      date: toISODate(entry.date),
      title: entry.title,
      description: entry.description,
      category: entry.category as TimelineEntry["category"],
      tags: entry.tags.map((tag) => tag.name),
    }));
  })
);
