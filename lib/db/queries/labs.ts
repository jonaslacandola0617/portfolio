import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { readWithPolicy } from "@/lib/db/read-policy";
import { estimateReadingTime } from "@/lib/reading-time";
import type { DbContentItem, LabFrontmatter } from "@/types";
import type { TipTapDoc } from "@/types/tiptap";

interface LabWithRelations {
  id: string;
  title: string;
  slug: string;
  purpose: string;
  content: unknown;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  progressStatus: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
  category: { name: string } | null;
  tags: { name: string }[];
  labDate: Date;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function mapLab(lab: LabWithRelations): DbContentItem<LabFrontmatter> {
  const doc = lab.content as TipTapDoc;
  return {
    recordId: lab.id,
    frontmatter: {
      title: lab.title,
      slug: lab.slug,
      purpose: lab.purpose,
      date: toISODate(lab.labDate),
      status: lab.progressStatus.toLowerCase().replace("_", "-") as LabFrontmatter["status"],
      difficulty: lab.difficulty.toLowerCase() as LabFrontmatter["difficulty"],
      tags: lab.tags.map((tag) => tag.name),
      category: lab.category?.name ?? "Uncategorized",
    },
    content: doc,
    readingTime: estimateReadingTime(doc),
  };
}

export async function getLabCount(): Promise<number> {
  return readWithPolicy("labs.getLabCount", 0, () => prisma.lab.count());
}

export const getAllLabs = cache(async (): Promise<DbContentItem<LabFrontmatter>[]> =>
  readWithPolicy("labs.getAllLabs", [], async () => {
    const labs = (await prisma.lab.findMany({
      where: { publishStatus: "PUBLISHED" },
      include: { category: true, tags: true },
      orderBy: { labDate: "desc" },
    })) as LabWithRelations[];
    return labs.map(mapLab);
  })
);

export const getLabBySlug = cache(
  async (slug: string): Promise<DbContentItem<LabFrontmatter> | undefined> =>
    readWithPolicy(`labs.getLabBySlug(${slug})`, undefined, async () => {
      const lab = (await prisma.lab.findFirst({
        where: { slug, publishStatus: "PUBLISHED" },
        include: { category: true, tags: true },
      })) as LabWithRelations | null;
      return lab ? mapLab(lab) : undefined;
    })
);

export const getAllLabSlugs = cache(async (): Promise<string[]> =>
  readWithPolicy("labs.getAllLabSlugs", [], async () => {
    const labs = await prisma.lab.findMany({
      where: { publishStatus: "PUBLISHED" },
      select: { slug: true },
    });
    return labs.map((lab) => lab.slug);
  })
);
