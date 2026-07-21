import "server-only";
import { prisma } from "@/lib/db";
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

function mapTimelineEntry(row: TimelineEntryRow): TimelineEntry {
  return {
    id: row.id,
    date: toISODate(row.date),
    title: row.title,
    description: row.description,
    category: row.category as TimelineEntry["category"],
    tags: row.tags.map((t) => t.name),
  };
}

export async function getAllTimelineEntries(): Promise<TimelineEntry[]> {
  try {
    const entries = (await prisma.timelineEntry.findMany({
      where: { publishStatus: "PUBLISHED" },
      include: { tags: true },
      orderBy: { date: "desc" },
    })) as TimelineEntryRow[];
    return entries.map(mapTimelineEntry);
  } catch (error) {
    console.error("[queries/timeline] getAllTimelineEntries failed, returning empty list:", error);
    return [];
  }
}
