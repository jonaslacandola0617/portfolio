import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { ProjectFormValues } from "@/lib/validations/project";
import type { JSONContent } from "@tiptap/react";

const EMPTY_DOC: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

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
      content: EMPTY_DOC,
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
export async function updateProjectContent(id: string, content: JSONContent) {
  const project = await prisma.project.update({
    where: { id },
    data: { content },
    select: { slug: true, publishStatus: true },
  });
  if (project.publishStatus === "PUBLISHED") await revalidateProjectPaths(project.slug);
}

export async function deleteProject(id: string) {
  const project = await prisma.project.delete({ where: { id }, select: { slug: true } });
  await revalidateProjectPaths(project.slug);
}

async function revalidateProjectPaths(slug: string) {
  revalidatePath("/projects");
  revalidatePath(`/projects/${slug}`);
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
}
