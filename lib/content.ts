import type { ArticleFrontmatter, LabFrontmatter } from "@/types";
import {
  getAllProjects as dbGetAllProjects,
  getProjectBySlug as dbGetProjectBySlug,
  getAllProjectSlugs as dbGetAllProjectSlugs,
} from "@/lib/db/queries/projects";
import {
  getAllLabs as dbGetAllLabs,
  getLabBySlug as dbGetLabBySlug,
  getAllLabSlugs as dbGetAllLabSlugs,
} from "@/lib/db/queries/labs";
import {
  getAllArticles as dbGetAllArticles,
  getArticleBySlug as dbGetArticleBySlug,
  getAllArticleSlugs as dbGetAllArticleSlugs,
} from "@/lib/db/queries/articles";

/**
 * As of Phase 3, every content type in this file is Prisma-backed — the
 * content/*.mdx files this used to read (via fs + gray-matter) are
 * retired; see docs/PHASE_3_REPORT.md. Every exported function below
 * keeps the exact name and shape it had when it read the filesystem —
 * that's what made each phase of this migration a swap behind a seam
 * instead of a rewrite (see docs/CMS_MIGRATION_PLAN.md §0).
 */

// ─── Projects ────────────────────────────────────────────────
export async function getAllProjects() {
  return dbGetAllProjects();
}

export async function getProjectBySlug(slug: string) {
  return dbGetProjectBySlug(slug);
}

export async function getAllProjectSlugs() {
  return dbGetAllProjectSlugs();
}

// ─── Labs ────────────────────────────────────────────────────
export async function getAllLabs() {
  return dbGetAllLabs();
}

export async function getLabBySlug(slug: string) {
  return dbGetLabBySlug(slug);
}

export async function getAllLabSlugs() {
  return dbGetAllLabSlugs();
}

// ─── Articles (Learning Journal) ────────────────────────────
export async function getAllArticles() {
  return dbGetAllArticles();
}

export async function getArticleBySlug(slug: string) {
  return dbGetArticleBySlug(slug);
}

export async function getAllArticleSlugs() {
  return dbGetAllArticleSlugs();
}

// ─── Cross-collection helpers ───────────────────────────────
// All three sources are async now (Phase 3) — simpler than Phase 2's
// in-between state, where this had to mix an async source with two sync
// ones.
export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const counts = new Map<string, number>();
  const bump = (tags: string[] = []) =>
    tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));

  const [projects, labs, articles] = await Promise.all([
    getAllProjects(),
    getAllLabs(),
    getAllArticles(),
  ]);
  projects.forEach((p) => bump(p.frontmatter.tags));
  labs.forEach((l) => bump(l.frontmatter.tags));
  articles.forEach((a) => bump(a.frontmatter.tags));

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getSearchIndex() {
  const [allProjects, allLabs, allArticles] = await Promise.all([
    getAllProjects(),
    getAllLabs(),
    getAllArticles(),
  ]);

  const projects = allProjects.map((p) => ({
    type: "project" as const,
    title: p.frontmatter.title,
    summary: p.frontmatter.summary,
    href: `/projects/${p.frontmatter.slug}`,
    tags: p.frontmatter.tags,
  }));
  const labs = allLabs.map((l) => ({
    type: "lab" as const,
    title: l.frontmatter.title,
    summary: l.frontmatter.purpose,
    href: `/labs/${l.frontmatter.slug}`,
    tags: l.frontmatter.tags,
  }));
  const articles = allArticles.map((a) => ({
    type: "article" as const,
    title: a.frontmatter.title,
    summary: a.frontmatter.summary,
    href: `/journal/${a.frontmatter.slug}`,
    tags: a.frontmatter.tags,
  }));

  return [...projects, ...labs, ...articles];
}
