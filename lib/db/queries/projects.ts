import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { readWithPolicy } from "@/lib/db/read-policy";
import { estimateReadingTime } from "@/lib/reading-time";
import type { DbContentItem, DownloadLink, ProjectFrontmatter } from "@/types";
import type { TipTapDoc } from "@/types/tiptap";

interface ProjectWithRelations {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: unknown;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  progressStatus: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
  category: { name: string } | null;
  tags: { name: string }[];
  skills: { name: string }[];
  technologies: string[];
  certificates: { id: string }[];
  downloads: { label: string; url: string; type: string }[];
  thumbnail: { url: string } | null;
  githubUrl: string | null;
  estimatedTime: string | null;
  completionDate: Date;
  updatedAt: Date;
}

const projectInclude = {
  category: true,
  tags: true,
  skills: true,
  certificates: true,
  downloads: true,
  thumbnail: true,
} as const;

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function mapProject(project: ProjectWithRelations): DbContentItem<ProjectFrontmatter> {
  const doc = project.content as TipTapDoc;
  return {
    recordId: project.id,
    frontmatter: {
      title: project.title,
      slug: project.slug,
      summary: project.summary,
      category: project.category?.name ?? "Uncategorized",
      difficulty: project.difficulty.toLowerCase() as ProjectFrontmatter["difficulty"],
      status: project.progressStatus.toLowerCase().replace("_", "-") as ProjectFrontmatter["status"],
      tags: project.tags.map((tag) => tag.name),
      technologies: project.technologies,
      skills: project.skills.map((skill) => skill.name),
      relatedCertification: project.certificates[0]?.id,
      estimatedTime: project.estimatedTime ?? "",
      completionDate: toISODate(project.completionDate),
      lastUpdated: toISODate(project.updatedAt),
      thumbnail: project.thumbnail?.url,
      githubUrl: project.githubUrl ?? undefined,
      downloads: project.downloads.map(
        (download): DownloadLink => ({
          label: download.label,
          href: download.url,
          type: download.type as DownloadLink["type"],
        })
      ),
    },
    content: doc,
    readingTime: estimateReadingTime(doc),
  };
}

export async function getProjectCount(): Promise<number> {
  return readWithPolicy("projects.getProjectCount", 0, () => prisma.project.count());
}

export const getAllProjects = cache(async (): Promise<DbContentItem<ProjectFrontmatter>[]> =>
  readWithPolicy("projects.getAllProjects", [], async () => {
    const projects = (await prisma.project.findMany({
      where: { publishStatus: "PUBLISHED" },
      include: projectInclude,
      orderBy: { completionDate: "desc" },
    })) as ProjectWithRelations[];
    return projects.map(mapProject);
  })
);

export const getProjectBySlug = cache(
  async (slug: string): Promise<DbContentItem<ProjectFrontmatter> | undefined> =>
    readWithPolicy(`projects.getProjectBySlug(${slug})`, undefined, async () => {
      const project = (await prisma.project.findFirst({
        where: { slug, publishStatus: "PUBLISHED" },
        include: projectInclude,
      })) as ProjectWithRelations | null;
      return project ? mapProject(project) : undefined;
    })
);

export const getAllProjectSlugs = cache(async (): Promise<string[]> =>
  readWithPolicy("projects.getAllProjectSlugs", [], async () => {
    const projects = await prisma.project.findMany({
      where: { publishStatus: "PUBLISHED" },
      select: { slug: true },
    });
    return projects.map((project) => project.slug);
  })
);
