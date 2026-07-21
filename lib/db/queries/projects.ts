import "server-only";
import { prisma } from "@/lib/db";
import { estimateReadingTime } from "@/lib/reading-time";
import type { DbContentItem, DownloadLink, ProjectFrontmatter } from "@/types";
import type { TipTapDoc } from "@/types/tiptap";

/**
 * Query layer rule: this is the ONLY place in the app that imports
 * `@/lib/db` for Project data. Pages and services call these functions;
 * they never call `prisma.project.*` directly. `import "server-only"`
 * enforces that at build time — an accidental import from a Client
 * Component fails the build instead of silently leaking a DB call to
 * the browser bundle.
 *
 * TEMPORARY: `ProjectWithRelations` below is hand-written rather than
 * `Prisma.ProjectGetPayload<{ include: ... }>`. That's not a style
 * choice — `@prisma/client`'s generated types don't exist yet in any
 * environment that hasn't run `prisma generate` against real network
 * access (see the Phase 0/1 reports for why that's still true in this
 * sandbox). `prisma` itself is typed `any` until then, so this file
 * would otherwise silently lose all type-checking on every query result.
 * Once `prisma generate` succeeds for real, replace this interface with
 * `Prisma.ProjectGetPayload<{ include: typeof projectInclude }>` and
 * delete it — everything below (mapProject, the exported functions)
 * keeps working unchanged, since it's structurally the same shape.
 */
interface ProjectWithRelations {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: unknown;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  progressStatus: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
  publishStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED";
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
  const doc = project.content as unknown as TipTapDoc;

  const frontmatter: ProjectFrontmatter = {
    title: project.title,
    slug: project.slug,
    summary: project.summary,
    category: project.category?.name ?? "Uncategorized",
    difficulty: project.difficulty.toLowerCase() as ProjectFrontmatter["difficulty"],
    status: project.progressStatus.toLowerCase().replace("_", "-") as ProjectFrontmatter["status"],
    tags: project.tags.map((t) => t.name),
    technologies: project.technologies,
    skills: project.skills.map((s) => s.name),
    relatedCertification: project.certificates[0]?.id,
    estimatedTime: project.estimatedTime ?? "",
    completionDate: toISODate(project.completionDate),
    lastUpdated: toISODate(project.updatedAt),
    thumbnail: project.thumbnail?.url,
    githubUrl: project.githubUrl ?? undefined,
    downloads: project.downloads.map(
      (d): DownloadLink => ({ label: d.label, href: d.url, type: d.type as DownloadLink["type"] })
    ),
  };

  return {
    frontmatter,
    content: doc,
    readingTime: estimateReadingTime(doc),
  };
}

export async function getProjectCount(): Promise<number> {
  try {
    return await prisma.project.count();
  } catch (error) {
    console.error("[queries/projects] getProjectCount failed:", error);
    return 0;
  }
}

export async function getAllProjects(): Promise<DbContentItem<ProjectFrontmatter>[]> {
  try {
    const projects = (await prisma.project.findMany({
      where: { publishStatus: "PUBLISHED" },
      include: projectInclude,
      orderBy: { completionDate: "desc" },
    })) as ProjectWithRelations[];
    return projects.map(mapProject);
  } catch (error) {
    // Deliberately fails open to an empty list, not a thrown error.
    // Callers include generateStaticParams (build time) and page
    // components (request time) — neither should take down the whole
    // build or return a 500 just because the DB isn't reachable yet
    // (e.g. before the first `prisma generate` + seed on a fresh
    // deploy). An empty /projects page is a recoverable, visible state;
    // a failed build is not.
    console.error("[queries/projects] getAllProjects failed, returning empty list:", error);
    return [];
  }
}

export async function getProjectBySlug(
  slug: string
): Promise<DbContentItem<ProjectFrontmatter> | undefined> {
  try {
    const project = (await prisma.project.findFirst({
      where: { slug, publishStatus: "PUBLISHED" },
      include: projectInclude,
    })) as ProjectWithRelations | null;
    return project ? mapProject(project) : undefined;
  } catch (error) {
    console.error(`[queries/projects] getProjectBySlug(${slug}) failed:`, error);
    return undefined;
  }
}

export async function getAllProjectSlugs(): Promise<string[]> {
  try {
    const projects = (await prisma.project.findMany({
      where: { publishStatus: "PUBLISHED" },
      select: { slug: true },
    })) as { slug: string }[];
    return projects.map((p) => p.slug);
  } catch (error) {
    console.error("[queries/projects] getAllProjectSlugs failed, returning empty list:", error);
    return [];
  }
}
