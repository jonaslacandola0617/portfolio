import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { slugify } from "@/lib/utils";
import type { ProjectFormValues } from "@/lib/validations/project";
import type { TipTapDoc } from "@/types/tiptap";

import { getTemplateDocument } from "@/lib/editor/templates";
import { toPrismaJson } from "@/lib/prisma-json";
import { revalidateContent } from "@/lib/services/content-revalidation";
import { skillRelationInput } from "@/lib/services/skill-relations";

interface AdminProjectListItem {
  id: string;
  title: string;
  slug: string;
  publishStatus: string;
  updatedAt: Date;
  category: { name: string } | null;
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
  liveSiteUrl: string | null;
  demoUrl: string | null;
  scheduledFor: Date | null;
}

function isWebDevelopmentCategory(category: string) {
  return category.trim().replace(/\s+/g, " ").toLocaleLowerCase() === "web development";
}

function webProjectLinks(fm: ProjectFormValues) {
  if (!isWebDevelopmentCategory(fm.category)) {
    return { liveSiteUrl: null, demoUrl: null };
  }

  return {
    liveSiteUrl: fm.liveSiteUrl || null,
    demoUrl: fm.demoUrl || null,
  };
}

async function relationInput(fm: ProjectFormValues) {
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
    skills: await skillRelationInput(fm.skills, { group: "Networking", level: "practiced" }),
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
  const relations = await relationInput(fm);
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
      ...webProjectLinks(fm),
      scheduledFor: fm.scheduledFor ? new Date(fm.scheduledFor) : null,
      publishedAt: fm.publishStatus === "PUBLISHED" ? new Date() : null,
      content: toPrismaJson(getTemplateDocument(fm.templateId, "project")),
      ...relations,
    },
  });

  revalidateContent("project", [project.slug]);
  return project;
}

export async function updateProjectMetadata(id: string, fm: ProjectFormValues) {
  const existing = await prisma.project.findUnique({ where: { id }, select: { slug: true, publishStatus: true } });
  const relations = await relationInput(fm);

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
      ...webProjectLinks(fm),
      scheduledFor: fm.scheduledFor ? new Date(fm.scheduledFor) : null,
      ...(fm.publishStatus === "PUBLISHED" && existing?.publishStatus !== "PUBLISHED"
        ? { publishedAt: new Date() }
        : {}),
      category: relations.category,
      tags: { set: [], ...relations.tags },
      skills: { set: [], ...relations.skills },
    },
  });

  revalidateContent("project", existing ? [existing.slug, project.slug] : [project.slug]);
  return project;
}

export async function updateProjectContent(id: string, content: TipTapDoc) {
  const project = await prisma.project.update({
    where: { id },
    data: { content: toPrismaJson(content) },
    select: { slug: true, publishStatus: true },
  });
  if (project.publishStatus === "PUBLISHED") revalidateContent("project", [project.slug]);
  const readBack = await prisma.project.findUnique({ where: { id }, select: { content: true } });
  return readBack?.content;
}

export async function deleteProject(id: string) {
  const project = await prisma.project.delete({ where: { id }, select: { slug: true } });
  revalidateContent("project", [project.slug]);
}

export async function deleteProjects(ids: string[]): Promise<number> {
  const slugs = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const records = await tx.project.findMany({ where: { id: { in: ids } }, select: { slug: true } });
    await tx.project.deleteMany({ where: { id: { in: ids } } });
    return records.map((r: { slug: string }) => r.slug);
  });

  revalidateContent("project", slugs);
  return slugs.length;
}
