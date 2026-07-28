import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { slugify } from "@/lib/utils";
import type { ProjectFormValues } from "@/lib/validations/project";
import type { TipTapDoc } from "@/types/tiptap";

import { projectTemplate } from "@/lib/editor/templates";
import { toPrismaJson } from "@/lib/prisma-json";

/**
 * Hand-written, same reasoning as lib/db/queries/projects.ts's
 * `ProjectWithRelations` — `@prisma/client`'s generated types don't
 * exist until `prisma generate` runs somewhere with network access to
 * `binaries.prisma.sh`. Swap for `Prisma.ProjectGetPayload<...>` once
 * that's run for real; nothing below needs to change structurally.
 */
interface AdminProjectListItem {
  id: string;
  title: string;
  slug: string;
  publishStatus: string;
  updatedAt: Date;
}

interface AdminProjectDetail {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: unknown;
  difficulty: string;
  progressStatus: string;
  publishStatus: string;
  category: { name: string } | null;
  tags: { name: string }[];
  skills: { name: string }[];
  technologies: string[];
  estimatedTime: string | null;
  completionDate: Date;
  githubUrl: string | null;
  scheduledFor: Date | null;
}

/**
 * Admin-side Project operations. Deliberately separate from
 * lib/db/queries/projects.ts, which is public/read-only and only ever
 * returns PUBLISHED rows — admin screens need every status (to list
 * drafts, edit archived items, etc.), and every function here mutates,
 * which the query layer's contract explicitly doesn't.
 */

function relationInput(fm: ProjectFormValues) {
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
    skills: {
      connectOrCreate: fm.skills.map((skill) => ({
        where: { name: skill },
        create: { name: skill, group: "Networking", level: "practiced" },
      })),
    },
  };
}

export async function getAllProjectsForAdmin(): Promise<AdminProjectListItem[]> {
  return prisma.project.findMany({
    include: { category: true, tags: true },
    orderBy: { updatedAt: "desc" },
  }) as Promise<AdminProjectListItem[]>;
}

export async function getProjectForEdit(id: string): Promise<AdminProjectDetail | null> {
  return prisma.project.findUnique({
    where: { id },
    include: { category: true, tags: true, skills: true, downloads: true, certificates: true },
  }) as Promise<AdminProjectDetail | null>;
}

export async function createProject(fm: ProjectFormValues) {
  const project = await prisma.project.create({
    data: {
      title: fm.title,
      slug: fm.slug,
      summary: fm.summary,
      difficulty: fm.difficulty,
      progressStatus: fm.progressStatus,
      publishStatus: fm.publishStatus,
      technologies: fm.technologies,
      estimatedTime: fm.estimatedTime || null,
      completionDate: new Date(fm.completionDate),
      githubUrl: fm.githubUrl || null,
      scheduledFor: fm.scheduledFor ? new Date(fm.scheduledFor) : null,
      publishedAt: fm.publishStatus === "PUBLISHED" ? new Date() : null,
      content: toPrismaJson(projectTemplate),
      ...relationInput(fm),
    },
  });

  await revalidateProjectPaths(project.slug);
  return project;
}

export async function updateProjectMetadata(id: string, fm: ProjectFormValues) {
  const existing = await prisma.project.findUnique({ where: { id }, select: { slug: true, publishStatus: true } });

  const project = await prisma.project.update({
    where: { id },
    data: {
      title: fm.title,
      slug: fm.slug,
      summary: fm.summary,
      difficulty: fm.difficulty,
      progressStatus: fm.progressStatus,
      publishStatus: fm.publishStatus,
      technologies: fm.technologies,
      estimatedTime: fm.estimatedTime || null,
      completionDate: new Date(fm.completionDate),
      githubUrl: fm.githubUrl || null,
      scheduledFor: fm.scheduledFor ? new Date(fm.scheduledFor) : null,
      // Only stamp publishedAt the moment status *becomes* PUBLISHED —
      // don't touch it on every subsequent edit of an already-published
      // project, or "originally published" becomes "last edited," which
      // is what updatedAt is already for.
      ...(fm.publishStatus === "PUBLISHED" && existing?.publishStatus !== "PUBLISHED"
        ? { publishedAt: new Date() }
        : {}),
      category: relationInput(fm).category,
      tags: { set: [], ...relationInput(fm).tags },
      skills: { set: [], ...relationInput(fm).skills },
    },
  });

  await revalidateProjectPaths(project.slug);
  if (existing && existing.slug !== project.slug) await revalidateProjectPaths(existing.slug);
  return project;
}

/** The autosave path — only touches `content`, called far more often
 *  than the metadata form is submitted, so it's a separate, smaller
 *  write rather than reusing updateProjectMetadata for this. */
export async function updateProjectContent(id: string, content: TipTapDoc) {
  const project = await prisma.project.update({
    where: { id },
    data: { content: toPrismaJson(content) },
    select: { slug: true, publishStatus: true },
  });
  if (project.publishStatus === "PUBLISHED") await revalidateProjectPaths(project.slug);
  const readBack = await prisma.project.findUnique({ where: { id }, select: { content: true } });
  return readBack?.content;
}

export async function deleteProject(id: string) {
  const project = await prisma.project.delete({ where: { id }, select: { slug: true } });
  await revalidateProjectPaths(project.slug);
}

/** Bulk delete for the management page's checkbox selection (added
 *  during the pre-Phase-6 stabilization pass, Workstream D). Wrapped in
 *  a transaction: the slugs are read and the rows deleted as one atomic
 *  unit, so a delete can't run against a set of ids that's already
 *  drifted from what was read (and so revalidation always matches what
 *  was actually removed). `deleteMany` itself is also a single SQL
 *  statement, so this is atomic even without the explicit transaction —
 *  the transaction's real purpose is keeping the find+delete pair
 *  consistent. */
export async function deleteProjects(ids: string[]): Promise<number> {
  const slugs = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const records = await tx.project.findMany({ where: { id: { in: ids } }, select: { slug: true } });
    await tx.project.deleteMany({ where: { id: { in: ids } } });
    return records.map((r: { slug: string }) => r.slug);
  });

  for (const slug of slugs) {
    revalidatePath(`/projects/${slug}`);
  }
  revalidatePath("/projects");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");

  return slugs.length;
}

async function revalidateProjectPaths(slug: string) {
  revalidatePath("/projects");
  revalidatePath(`/projects/${slug}`);
  revalidatePath("/tags/[tag]", "page");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
}
