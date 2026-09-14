import "server-only";

import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { createProject, getProjectForEdit, updateProjectMetadata } from "@/lib/services/project-admin-service";
import {
  getGitHubRepositoryDetails,
  getGitHubRepositorySource,
  normalizeGitHubRepositoryUrl,
  type GitHubProjectRepository,
} from "@/lib/github/project-sync";
import { projectFormSchema, type ProjectFormValues } from "@/lib/validations/project";

export interface GitHubLinkedProject {
  id: string;
  title: string;
  publishStatus: string;
}

export interface GitHubRepositoryRow extends GitHubProjectRepository {
  linkedProject: GitHubLinkedProject | null;
}

export interface GitHubProjectDashboard {
  repositories: GitHubRepositoryRow[];
  accessMode: "app" | "public";
  appConfigured: boolean;
  appInstalled: boolean;
  appInstallUrl: string | null;
  installationAccounts: string[];
  error: string | null;
}

const WEB_LANGUAGES = new Set([
  "TypeScript",
  "JavaScript",
  "HTML",
  "CSS",
  "PHP",
  "Blade",
  "Vue",
  "Svelte",
  "Astro",
]);

function inferCategory(repo: GitHubProjectRepository, languages: string[]) {
  if (repo.homepage || languages.some((language) => WEB_LANGUAGES.has(language))) {
    return "Web Development";
  }
  return "Software Development";
}

function humanizeRepositoryName(name: string) {
  return name
    .split(/[-_]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function validHttpsUrl(value: string | null | undefined) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

async function uniqueProjectSlug(seed: string) {
  const base = slugify(seed) || "github-project";
  let candidate = base;
  let suffix = 2;

  while (await prisma.project.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function findLinkedProject(repoUrl: string) {
  const normalized = normalizeGitHubRepositoryUrl(repoUrl);
  if (!normalized) return null;

  const projects = await prisma.project.findMany({
    where: { githubUrl: { not: null } },
    select: { id: true, title: true, publishStatus: true, githubUrl: true },
  });

  return projects.find((project) => normalizeGitHubRepositoryUrl(project.githubUrl) === normalized) ?? null;
}

export async function getGitHubProjectDashboard(owner: string): Promise<GitHubProjectDashboard> {
  const [source, projects] = await Promise.all([
    getGitHubRepositorySource(owner),
    prisma.project.findMany({
      where: { githubUrl: { not: null } },
      select: { id: true, title: true, publishStatus: true, githubUrl: true },
    }),
  ]);

  const linkedByUrl = new Map(
    projects
      .map((project) => [normalizeGitHubRepositoryUrl(project.githubUrl), project] as const)
      .filter((entry): entry is [string, (typeof projects)[number]] => Boolean(entry[0])),
  );

  return {
    ...source,
    repositories: source.repositories.map((repository) => {
      const linked = linkedByUrl.get(normalizeGitHubRepositoryUrl(repository.htmlUrl) ?? "");
      return {
        ...repository,
        linkedProject: linked
          ? { id: linked.id, title: linked.title, publishStatus: linked.publishStatus }
          : null,
      };
    }),
  };
}

export async function importGitHubRepository(fullName: string) {
  const { repository, languages } = await getGitHubRepositoryDetails(fullName);
  const existing = await findLinkedProject(repository.htmlUrl);
  if (existing) {
    return {
      projectId: existing.id,
      alreadyLinked: true,
      message: `${repository.fullName} is already linked to ${existing.title}.`,
    };
  }

  const category = inferCategory(repository, languages);
  const title = humanizeRepositoryName(repository.name);
  const slug = await uniqueProjectSlug(repository.name);
  const technologies = languages.length > 0
    ? languages
    : repository.primaryLanguage
      ? [repository.primaryLanguage]
      : [];

  const formValues: ProjectFormValues = projectFormSchema.parse({
    title,
    slug,
    summary:
      repository.description?.trim() ||
      `Imported from ${repository.fullName}. Add a portfolio-ready summary before publishing.`,
    category,
    difficulty: "INTERMEDIATE",
    progressStatus: repository.archived ? "COMPLETED" : "IN_PROGRESS",
    publishStatus: "DRAFT",
    tags: repository.topics,
    skills: [],
    technologies,
    estimatedTime: "",
    completionDate: (repository.pushedAt ?? repository.updatedAt).slice(0, 10),
    githubUrl: repository.htmlUrl,
    liveSiteUrl: category === "Web Development" ? validHttpsUrl(repository.homepage) : "",
    demoUrl: "",
    scheduledFor: "",
    templateId: category === "Web Development" ? "project-web" : "project-software",
  });

  const project = await createProject(formValues);
  return {
    projectId: project.id,
    alreadyLinked: false,
    message: `${repository.fullName} was imported as a draft project.`,
  };
}

export async function syncGitHubProject(projectId: string) {
  const project = await getProjectForEdit(projectId);
  if (!project) throw new Error("Project not found.");

  const normalized = normalizeGitHubRepositoryUrl(project.githubUrl);
  if (!normalized) throw new Error("This project does not have a valid GitHub repository URL.");

  const fullName = new URL(normalized).pathname.split("/").filter(Boolean).slice(0, 2).join("/");
  const { repository, languages } = await getGitHubRepositoryDetails(fullName);

  const mergedTechnologies = Array.from(new Set([
    ...project.technologies,
    ...languages,
    ...(repository.primaryLanguage ? [repository.primaryLanguage] : []),
  ]));
  const mergedTags = Array.from(new Set([
    ...project.tags.map((tag) => tag.name),
    ...repository.topics,
  ]));

  const category = project.category?.name ?? inferCategory(repository, languages);
  const formValues: ProjectFormValues = projectFormSchema.parse({
    title: project.title,
    slug: project.slug,
    summary: project.summary,
    category,
    difficulty: project.difficulty,
    progressStatus: project.progressStatus,
    publishStatus: project.publishStatus,
    tags: mergedTags,
    skills: project.skills.map((skill) => skill.name),
    technologies: mergedTechnologies,
    estimatedTime: project.estimatedTime ?? "",
    completionDate: project.completionDate.toISOString().slice(0, 10),
    githubUrl: repository.htmlUrl,
    liveSiteUrl:
      project.liveSiteUrl || (category === "Web Development" ? validHttpsUrl(repository.homepage) : ""),
    demoUrl: project.demoUrl ?? "",
    scheduledFor: project.scheduledFor?.toISOString() ?? "",
    templateId: "project-blank",
  });

  await updateProjectMetadata(projectId, formValues);
  return {
    projectId,
    message: `${repository.fullName} metadata was synced without changing your project documentation.`,
  };
}
