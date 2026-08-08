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
import { getAllCertificates } from "@/lib/db/queries/certificates";
import { getAllPublishedTags } from "@/lib/db/queries/tags";

export async function getAllProjects() {
  return dbGetAllProjects();
}

export async function getProjectBySlug(slug: string) {
  return dbGetProjectBySlug(slug);
}

export async function getAllProjectSlugs() {
  return dbGetAllProjectSlugs();
}

export async function getAllLabs() {
  return dbGetAllLabs();
}

export async function getLabBySlug(slug: string) {
  return dbGetLabBySlug(slug);
}

export async function getAllLabSlugs() {
  return dbGetAllLabSlugs();
}

export async function getAllArticles() {
  return dbGetAllArticles();
}

export async function getArticleBySlug(slug: string) {
  return dbGetArticleBySlug(slug);
}

export async function getAllArticleSlugs() {
  return dbGetAllArticleSlugs();
}

export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const tags = await getAllPublishedTags();
  return tags.map(({ name, count }) => ({ tag: name, count }));
}

export async function getSearchIndex() {
  const [allProjects, allLabs, allArticles, allCertificates] = await Promise.all([
    getAllProjects(),
    getAllLabs(),
    getAllArticles(),
    getAllCertificates(),
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
  const certificates = allCertificates.map((certificate) => ({
    type: "certificate" as const,
    title: certificate.name,
    summary: `${certificate.issuer} — completed certification`,
    href: "/certifications",
    tags: certificate.skills,
  }));

  return [...projects, ...labs, ...articles, ...certificates];
}
