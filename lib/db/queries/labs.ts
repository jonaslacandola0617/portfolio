import "server-only";
import { prisma } from "@/lib/db";
import { estimateReadingTime } from "@/lib/reading-time";
import type { DbContentItem, LabFrontmatter } from "@/types";
import type { TipTapDoc } from "@/types/tiptap";

/**
 * Same pattern as lib/db/queries/projects.ts (Phase 2) — see that file's
 * comments for why ProgressStatus/PublishStatus stay separate, why
 * `LabWithRelations` is hand-written rather than
 * `Prisma.LabGetPayload<...>`, and why every function fails open.
 */
interface LabWithRelations {
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
  const doc = lab.content as unknown as TipTapDoc;

  const frontmatter: LabFrontmatter = {
    title: lab.title,
    slug: lab.slug,
    purpose: lab.purpose,
    date: toISODate(lab.labDate),
    status: lab.progressStatus.toLowerCase().replace("_", "-") as LabFrontmatter["status"],
    difficulty: lab.difficulty.toLowerCase() as LabFrontmatter["difficulty"],
    tags: lab.tags.map((t) => t.name),
    category: lab.category?.name ?? "Uncategorized",
  };

  return { frontmatter, content: doc, readingTime: estimateReadingTime(doc) };
}

export async function getLabCount(): Promise<number> {
  try {
    return await prisma.lab.count();
  } catch (error) {
    console.error("[queries/labs] getLabCount failed:", error);
    return 0;
  }
}

export async function getAllLabs(): Promise<DbContentItem<LabFrontmatter>[]> {
  try {
    const labs = (await prisma.lab.findMany({
      where: { publishStatus: "PUBLISHED" },
      include: { category: true, tags: true },
      orderBy: { labDate: "desc" },
    })) as LabWithRelations[];
    return labs.map(mapLab);
  } catch (error) {
    console.error("[queries/labs] getAllLabs failed, returning empty list:", error);
    return [];
  }
}

export async function getLabBySlug(slug: string): Promise<DbContentItem<LabFrontmatter> | undefined> {
  try {
    const lab = (await prisma.lab.findFirst({
      where: { slug, publishStatus: "PUBLISHED" },
      include: { category: true, tags: true },
    })) as LabWithRelations | null;
    return lab ? mapLab(lab) : undefined;
  } catch (error) {
    console.error(`[queries/labs] getLabBySlug(${slug}) failed:`, error);
    return undefined;
  }
}

export async function getAllLabSlugs(): Promise<string[]> {
  try {
    const labs = (await prisma.lab.findMany({
      where: { publishStatus: "PUBLISHED" },
      select: { slug: true },
    })) as { slug: string }[];
    return labs.map((l) => l.slug);
  } catch (error) {
    console.error("[queries/labs] getAllLabSlugs failed, returning empty list:", error);
    return [];
  }
}
